import { Router } from "express";
import pool from "../config/database_connection";
const router=Router();
router.get("/age-groups",async(_req,res)=>{const r=await pool.query(`SELECT a.*,COUNT(DISTINCT c.id)::int category_count FROM age_groups a LEFT JOIN game_categories c ON c.age_group_id=a.id GROUP BY a.id ORDER BY a.min_age`);res.json({success:true,ageGroups:r.rows})});
router.get("/age-groups/:id/categories",async(req,res)=>{const r=await pool.query(`SELECT c.*,COUNT(l.id)::int level_count FROM game_categories c LEFT JOIN game_levels l ON l.category_id=c.id WHERE c.age_group_id=$1 GROUP BY c.id ORDER BY c.created_at`,[req.params.id]);res.json({success:true,categories:r.rows})});
router.get("/categories/:id/levels",async(req,res)=>{const r=await pool.query("SELECT * FROM game_levels WHERE category_id=$1 ORDER BY level_number",[req.params.id]);res.json({success:true,levels:r.rows})});
export default router;
