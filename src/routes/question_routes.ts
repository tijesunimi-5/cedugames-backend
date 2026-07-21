import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import pool from "../config/database_connection";
import { logActivity } from "../helpers/activityLog";
import { verifyAdminToken } from "../middlewares/authentication_middleware";

const router = Router();
const uploadRoot = path.resolve(process.cwd(), "uploads", "questions");
fs.mkdirSync(uploadRoot, { recursive: true });
const allowedMimeTypes: Record<string, string> = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp",
  "audio/mpeg": ".mp3", "audio/wav": ".wav", "audio/ogg": ".ogg",
  "video/mp4": ".mp4", "video/webm": ".webm",
  "application/pdf": ".pdf",
};
const upload = multer({
  storage: multer.diskStorage({ destination: uploadRoot, filename: (_req, file, done) => done(null, `${randomUUID()}${allowedMimeTypes[file.mimetype] || ""}`) }),
  limits: { fileSize: 20 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, done) => allowedMimeTypes[file.mimetype] ? done(null, true) : done(new Error("Unsupported media type.")),
});
const fields = [{ name: "questionMedia", maxCount: 1 }, ...Array.from({ length: 4 }, (_, index) => ({ name: `optionMedia${index}`, maxCount: 1 }))];
const shapeSchema = z.object({ type: z.enum(["circle", "square", "rectangle", "triangle", "star", "hexagon"]), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }).nullable().optional();
const optionSchema = z.object({ text: z.string().trim().max(5000), isCorrect: z.boolean(), mediaType: z.enum(["image", "audio", "video", "document"]).nullable().optional(), shape: shapeSchema });
const bodySchema = z.object({
  questionText: z.string().trim().max(10000).default(""), explanation: z.string().trim().max(5000).default(""), shape: z.string().default("null").transform((value, ctx) => { try { return shapeSchema.parse(JSON.parse(value)); } catch { ctx.addIssue({ code: "custom", message: "Invalid question shape." }); return z.NEVER; } }),
  ageGroupId: z.string().uuid(), categoryId: z.string().uuid(), levelId: z.string().uuid(),
  status: z.enum(["draft", "published"]).default("published"),
  questionMediaType: z.enum(["", "image", "audio", "video", "document"]).default(""),
  options: z.string().transform((value, ctx) => { try { return z.array(optionSchema).length(4).parse(JSON.parse(value)); } catch { ctx.addIssue({ code: "custom", message: "Four valid options are required." }); return z.NEVER; } }),
});
const mediaUrl = (file?: Express.Multer.File) => file ? `/uploads/questions/${file.filename}` : null;
const cleanup = (files: Express.Multer.File[]) => files.forEach((file) => fs.unlink(file.path, () => undefined));
const cleanRichText = (value: string) => sanitizeHtml(value, { allowedTags: ["p","br","strong","b","em","i","u","s","ul","ol","li","div"], allowedAttributes: { div: ["style"], p: ["style"] }, allowedStyles: { "*": { "text-align": [/^left$/, /^center$/, /^right$/] } } });
const plainText = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;/g, " ").trim();

router.post("/admin/questions", verifyAdminToken, upload.fields(fields), async (req, res) => {
  const fileMap = (req.files || {}) as Record<string, Express.Multer.File[]>;
  const uploadedFiles = Object.values(fileMap).flat();
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) { cleanup(uploadedFiles); return res.status(400).json({ success: false, errors: parsed.error.issues }); }
  const data = parsed.data;
  const questionFile = fileMap.questionMedia?.[0];
  const questionText = cleanRichText(data.questionText);
  const optionTexts = data.options.map((option) => cleanRichText(option.text));
  if (!plainText(questionText) && !questionFile && !data.shape) { cleanup(uploadedFiles); return res.status(400).json({ success: false, message: "Question text, media, or a shape is required." }); }
  if (data.options.filter((option) => option.isCorrect).length !== 1) { cleanup(uploadedFiles); return res.status(400).json({ success: false, message: "Exactly one option must be correct." }); }
  if (data.options.some((option, index) => !plainText(optionTexts[index] || "") && !fileMap[`optionMedia${index}`]?.[0] && !option.shape)) { cleanup(uploadedFiles); return res.status(400).json({ success: false, message: "Every option needs text, media, or a shape." }); }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const hierarchy = await client.query(`SELECT 1 FROM game_levels l JOIN game_categories c ON c.id=l.category_id WHERE l.id=$1 AND c.id=$2 AND c.age_group_id=$3`, [data.levelId, data.categoryId, data.ageGroupId]);
    if (!hierarchy.rowCount) { await client.query("ROLLBACK"); cleanup(uploadedFiles); return res.status(400).json({ success: false, message: "The selected age group, category, and level do not match." }); }
    const inserted = await client.query(`INSERT INTO questions(age_group_id,category_id,level_id,question_text,explanation,media_url,media_type,status,shape_type,shape_color) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [data.ageGroupId, data.categoryId, data.levelId, questionText, data.explanation, mediaUrl(questionFile), questionFile ? data.questionMediaType : null, data.status, data.shape?.type || null, data.shape?.color || null]);
    for (let index = 0; index < data.options.length; index += 1) {
      const option = data.options[index]!; const file = fileMap[`optionMedia${index}`]?.[0];
      await client.query(`INSERT INTO question_options(question_id,option_order,option_text,media_url,media_type,is_correct,shape_type,shape_color) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [inserted.rows[0].id, index, optionTexts[index], mediaUrl(file), file ? option.mediaType : null, option.isCorrect, option.shape?.type || null, option.shape?.color || null]);
    }
    await client.query("COMMIT");
    await logActivity({ eventType: "content.question_created", title: "Question created", description: `A ${data.status} question was added` });
    return res.status(201).json({ success: true, question: inserted.rows[0] });
  } catch (error) { await client.query("ROLLBACK"); cleanup(uploadedFiles); throw error; } finally { client.release(); }
});

router.get("/admin/levels/:levelId/questions", verifyAdminToken, async (req, res) => {
  const result = await pool.query(`SELECT q.id,q.question_text,q.explanation,q.media_url,q.media_type,q.shape_type,q.shape_color,q.status,q.created_at,l.name level_name,l.level_number,l.points_per_question,l.time_limit_seconds,COALESCE(json_agg(json_build_object('id',o.id,'text',o.option_text,'mediaUrl',o.media_url,'mediaType',o.media_type,'isCorrect',o.is_correct,'shapeType',o.shape_type,'shapeColor',o.shape_color) ORDER BY o.option_order) FILTER (WHERE o.id IS NOT NULL),'[]') options FROM questions q JOIN game_levels l ON l.id=q.level_id LEFT JOIN question_options o ON o.question_id=q.id WHERE q.level_id=$1 GROUP BY q.id,l.name,l.level_number,l.points_per_question,l.time_limit_seconds ORDER BY q.created_at DESC`, [req.params.levelId]);
  const level = await pool.query("SELECT id,name,level_number,description,points_per_question,time_limit_seconds FROM game_levels WHERE id=$1", [req.params.levelId]);
  if (!level.rows[0]) return res.status(404).json({ success: false, message: "Level not found." });
  return res.json({ success: true, level: level.rows[0], questions: result.rows.map((row: Record<string, unknown>) => ({ id: row.id, text: row.question_text, explanation: row.explanation, mediaUrl: row.media_url, mediaType: row.media_type, shapeType: row.shape_type, shapeColor: row.shape_color, status: row.status, createdAt: row.created_at, points: row.points_per_question, timeLimit: row.time_limit_seconds, options: row.options })) });
});

router.get("/catalog/levels/:levelId/questions", async (req, res) => {
  const result = await pool.query(`SELECT q.id,q.question_text,q.explanation,q.media_url,q.media_type,q.shape_type,q.shape_color,l.points_per_question,l.time_limit_seconds,COALESCE(json_agg(json_build_object('id',o.id,'text',o.option_text,'mediaUrl',o.media_url,'mediaType',o.media_type,'isCorrect',o.is_correct,'shapeType',o.shape_type,'shapeColor',o.shape_color) ORDER BY o.option_order) FILTER (WHERE o.id IS NOT NULL),'[]') options FROM questions q JOIN game_levels l ON l.id=q.level_id LEFT JOIN question_options o ON o.question_id=q.id WHERE q.level_id=$1 AND q.status='published' GROUP BY q.id,l.points_per_question,l.time_limit_seconds ORDER BY q.created_at`, [req.params.levelId]);
  res.json({ success: true, questions: result.rows.map((row: Record<string, unknown>) => ({ id: row.id, text: row.question_text, explanation: row.explanation, mediaUrl: row.media_url, mediaType: row.media_type, shapeType: row.shape_type, shapeColor: row.shape_color, points: row.points_per_question, timeLimit: row.time_limit_seconds, options: row.options })) });
});

export default router;
