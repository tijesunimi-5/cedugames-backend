import type { PoolClient } from "pg";
import crypto from "node:crypto";
import pool from "../config/database_connection";

export type CoinEntry = {
  userId: string;
  type: "purchase" | "reward" | "deduction" | "adjustment";
  amount: number;
  description: string;
  reference?: string | null | undefined;
  packageId?: string | null | undefined;
  ruleId?: string | null | undefined;
  createdBy?: string | null | undefined;
  metadata?: Record<string, unknown>;
};

export async function recordCoinTransaction(entry: CoinEntry, existingClient?: PoolClient) {
  const client = existingClient || await pool.connect();
  const ownsClient = !existingClient;
  try {
    if (ownsClient) await client.query("BEGIN");
    const signedAmount = entry.type === "deduction" ? -Math.abs(entry.amount) : Math.abs(entry.amount);
    if (!signedAmount) throw Object.assign(new Error("Coin amount must be greater than zero."), { status: 400 });
    const userResult = await client.query("SELECT coins_count FROM users WHERE id=$1 FOR UPDATE", [entry.userId]);
    if (!userResult.rows[0]) throw Object.assign(new Error("User not found."), { status: 404 });
    const balanceAfter = Number(userResult.rows[0].coins_count) + signedAmount;
    if (balanceAfter < 0) throw Object.assign(new Error("The user does not have enough coins."), { status: 409 });
    await client.query("UPDATE users SET coins_count=$1,updated_at=NOW() WHERE id=$2", [balanceAfter, entry.userId]);
    const result = await client.query(
      `INSERT INTO coin_transactions(user_id,type,amount,balance_after,description,reference,package_id,rule_id,created_by,metadata)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [entry.userId, entry.type, signedAmount, balanceAfter, entry.description, entry.reference || null, entry.packageId || null, entry.ruleId || null, entry.createdBy || null, entry.metadata || {}],
    );
    if (ownsClient) await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    if (ownsClient) await client.query("ROLLBACK");
    throw error;
  } finally {
    if (ownsClient) client.release();
  }
}

export async function applyCoinRule(userId: string, eventKey: string, type: "reward" | "deduction", metadata: Record<string, unknown> = {}) {
  const ruleResult = await pool.query(
    "SELECT * FROM coin_rules WHERE event_key=$1 AND type=$2 AND is_active=true",
    [eventKey, type],
  );
  const rule = ruleResult.rows[0];
  if (!rule) return null;
  const now = new Date();
  const bucket = rule.frequency === "once" ? "once"
    : rule.frequency === "daily" ? now.toISOString().slice(0, 10)
    : rule.frequency === "weekly" ? `${now.getUTCFullYear()}-w${Math.ceil((((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 1)) / 86400000) + new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).getUTCDay() + 1) / 7)}`
    : `${now.toISOString()}-${crypto.randomUUID()}`;
  try {
    return await recordCoinTransaction({
      userId, type, amount: Number(rule.amount), ruleId: rule.id,
      description: rule.description || rule.name,
      reference: `rule:${rule.id}:user:${userId}:${bucket}`,
      metadata: { ...metadata, eventKey },
    });
  } catch (error: any) {
    if (error.code === "23505") return null;
    throw error;
  }
}
