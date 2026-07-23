import type { PoolClient } from "pg";
import pool from "../config/database_connection";

export async function awardEligibleBadges(userId: string, client: PoolClient) {
  const metrics = await client.query(
    `SELECT u.total_xp,
     COUNT(a.id)::int attempts_completed,
     COUNT(DISTINCT a.level_id) FILTER (WHERE a.passed)::int levels_completed,
     COUNT(a.id) FILTER (WHERE a.score_percent=100)::int perfect_scores
     FROM users u LEFT JOIN gameplay_attempts a ON a.user_id=u.id
     WHERE u.id=$1 GROUP BY u.id`,
    [userId],
  );
  const values = metrics.rows[0];
  if (!values) return [];
  const badges = await client.query(
    `SELECT b.* FROM badges b
     WHERE b.is_active=true
       AND CASE b.criteria_type
         WHEN 'levels_completed' THEN $2 >= b.criteria_value
         WHEN 'attempts_completed' THEN $3 >= b.criteria_value
         WHEN 'perfect_scores' THEN $4 >= b.criteria_value
         WHEN 'total_xp' THEN $5 >= b.criteria_value
         ELSE false END
       AND NOT EXISTS (SELECT 1 FROM user_badges ub WHERE ub.user_id=$1 AND ub.badge_id=b.id)
     ORDER BY b.sort_order,b.name`,
    [userId, Number(values.levels_completed), Number(values.attempts_completed), Number(values.perfect_scores), Number(values.total_xp)],
  );
  const awarded = [];
  for (const badge of badges.rows) {
    const inserted = await client.query(
      "INSERT INTO user_badges(user_id,badge_id) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING earned_at",
      [userId, badge.id],
    );
    if (inserted.rows[0]) awarded.push({ ...badge, earned_at: inserted.rows[0].earned_at });
  }
  return awarded;
}

export async function backfillBadgeAwards(badgeId: string) {
  await pool.query(
    `WITH metrics AS (
       SELECT u.id user_id,u.total_xp,
        COUNT(a.id)::int attempts_completed,
        COUNT(DISTINCT a.level_id) FILTER (WHERE a.passed)::int levels_completed,
        COUNT(a.id) FILTER (WHERE a.score_percent=100)::int perfect_scores
       FROM users u LEFT JOIN gameplay_attempts a ON a.user_id=u.id
       WHERE u.role='user' GROUP BY u.id
     )
     INSERT INTO user_badges(user_id,badge_id)
     SELECT m.user_id,b.id FROM metrics m JOIN badges b ON b.id=$1
     WHERE b.is_active=true AND CASE b.criteria_type
       WHEN 'levels_completed' THEN m.levels_completed >= b.criteria_value
       WHEN 'attempts_completed' THEN m.attempts_completed >= b.criteria_value
       WHEN 'perfect_scores' THEN m.perfect_scores >= b.criteria_value
       WHEN 'total_xp' THEN m.total_xp >= b.criteria_value
       ELSE false END
     ON CONFLICT DO NOTHING`,
    [badgeId],
  );
}
