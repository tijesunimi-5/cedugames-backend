CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  description varchar(500) NOT NULL DEFAULT '',
  tier varchar(20) NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  criteria_type varchar(40) NOT NULL CHECK (criteria_type IN ('levels_completed','attempts_completed','perfect_scores','total_xp')),
  criteria_value integer NOT NULL CHECK (criteria_value > 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS badges_name_lower_unique ON badges(lower(name));

CREATE TABLE IF NOT EXISTS user_badges (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,badge_id)
);
CREATE INDEX IF NOT EXISTS user_badges_earned_idx ON user_badges(earned_at DESC);

INSERT INTO badges(id,name,description,tier,criteria_type,criteria_value,sort_order) VALUES
('40000000-0000-4000-8000-000000000001','First Steps','Complete your first learning level.','bronze','levels_completed',1,10),
('40000000-0000-4000-8000-000000000002','Level Explorer','Complete five different learning levels.','silver','levels_completed',5,20),
('40000000-0000-4000-8000-000000000003','Committed Learner','Finish ten game attempts.','silver','attempts_completed',10,30),
('40000000-0000-4000-8000-000000000004','Perfect Score','Score 100% on a game level.','gold','perfect_scores',1,40),
('40000000-0000-4000-8000-000000000005','XP Champion','Earn 1,000 total XP.','gold','total_xp',1000,50)
ON CONFLICT DO NOTHING;

WITH metrics AS (
  SELECT u.id user_id,u.total_xp,
    COUNT(a.id)::int attempts_completed,
    COUNT(DISTINCT a.level_id) FILTER (WHERE a.passed)::int levels_completed,
    COUNT(a.id) FILTER (WHERE a.score_percent=100)::int perfect_scores
  FROM users u LEFT JOIN gameplay_attempts a ON a.user_id=u.id
  WHERE u.role='user' GROUP BY u.id
)
INSERT INTO user_badges(user_id,badge_id)
SELECT m.user_id,b.id FROM metrics m CROSS JOIN badges b
WHERE b.is_active=true AND CASE b.criteria_type
  WHEN 'levels_completed' THEN m.levels_completed >= b.criteria_value
  WHEN 'attempts_completed' THEN m.attempts_completed >= b.criteria_value
  WHEN 'perfect_scores' THEN m.perfect_scores >= b.criteria_value
  WHEN 'total_xp' THEN m.total_xp >= b.criteria_value
  ELSE false END
ON CONFLICT DO NOTHING;

-- migrate:down
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS badges;
