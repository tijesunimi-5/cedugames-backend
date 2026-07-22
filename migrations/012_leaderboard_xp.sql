ALTER TABLE gameplay_attempts ADD COLUMN IF NOT EXISTS xp_awarded integer NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0);
CREATE INDEX IF NOT EXISTS gameplay_attempts_leaderboard_idx ON gameplay_attempts(created_at DESC,user_id) INCLUDE (xp_awarded,passed,score_percent,level_id);

-- migrate:down
DROP INDEX IF EXISTS gameplay_attempts_leaderboard_idx;
ALTER TABLE gameplay_attempts DROP COLUMN IF EXISTS xp_awarded;
