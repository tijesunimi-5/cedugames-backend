ALTER TABLE game_levels
  ADD COLUMN IF NOT EXISTS points_per_question integer NOT NULL DEFAULT 10 CHECK(points_per_question > 0),
  ADD COLUMN IF NOT EXISTS time_limit_seconds integer NOT NULL DEFAULT 30 CHECK(time_limit_seconds >= 5);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group_id uuid NOT NULL REFERENCES age_groups(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES game_categories(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES game_levels(id) ON DELETE CASCADE,
  question_text varchar(500) NOT NULL DEFAULT '',
  explanation text NOT NULL DEFAULT '',
  media_url text,
  media_type varchar(20) CHECK(media_type IN ('image','audio','video','document')),
  status varchar(20) NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(length(trim(question_text)) >= 5 OR media_url IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_order smallint NOT NULL CHECK(option_order BETWEEN 0 AND 3),
  option_text varchar(180) NOT NULL DEFAULT '',
  media_url text,
  media_type varchar(20) CHECK(media_type IN ('image','audio','video','document')),
  is_correct boolean NOT NULL DEFAULT false,
  UNIQUE(question_id, option_order),
  CHECK(length(trim(option_text)) > 0 OR media_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS questions_level_status_idx ON questions(level_id, status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS one_correct_option_per_question ON question_options(question_id) WHERE is_correct;

-- migrate:down
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
ALTER TABLE game_levels DROP COLUMN IF EXISTS time_limit_seconds, DROP COLUMN IF EXISTS points_per_question;
