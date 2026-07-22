CREATE TABLE IF NOT EXISTS gameplay_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  passing_score_percent integer NOT NULL DEFAULT 50 CHECK (passing_score_percent BETWEEN 0 AND 100),
  max_lives integer NOT NULL DEFAULT 3 CHECK (max_lives BETWEEN 1 AND 10),
  refill_coin_cost integer NOT NULL DEFAULT 100 CHECK (refill_coin_cost > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO gameplay_settings(id) VALUES(1) ON CONFLICT(id) DO NOTHING;

CREATE TABLE IF NOT EXISTS gameplay_attempts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES game_levels(id) ON DELETE CASCADE,
  score_percent integer NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  correct_answers integer NOT NULL CHECK (correct_answers >= 0),
  total_questions integer NOT NULL CHECK (total_questions > 0),
  passed boolean NOT NULL,
  life_lost boolean NOT NULL DEFAULT false,
  lives_after integer NOT NULL CHECK (lives_after >= 0),
  refill_transaction_id uuid REFERENCES coin_transactions(id) ON DELETE SET NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gameplay_attempts_user_created_idx ON gameplay_attempts(user_id, created_at DESC);

UPDATE users SET lives_remaining=LEAST(lives_remaining,3);

-- migrate:down
DROP TABLE IF EXISTS gameplay_attempts;
DROP TABLE IF EXISTS gameplay_settings;
