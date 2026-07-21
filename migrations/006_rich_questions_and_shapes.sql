ALTER TABLE questions
  ALTER COLUMN question_text TYPE text,
  ADD COLUMN IF NOT EXISTS shape_type varchar(20) CHECK(shape_type IN ('circle','square','rectangle','triangle','star','hexagon')),
  ADD COLUMN IF NOT EXISTS shape_color varchar(7) CHECK(shape_color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE question_options
  ALTER COLUMN option_text TYPE text,
  ADD COLUMN IF NOT EXISTS shape_type varchar(20) CHECK(shape_type IN ('circle','square','rectangle','triangle','star','hexagon')),
  ADD COLUMN IF NOT EXISTS shape_color varchar(7) CHECK(shape_color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_question_text_check;
ALTER TABLE questions ADD CONSTRAINT questions_content_required CHECK(length(trim(question_text)) >= 5 OR media_url IS NOT NULL OR shape_type IS NOT NULL);

ALTER TABLE question_options DROP CONSTRAINT IF EXISTS question_options_check;
ALTER TABLE question_options DROP CONSTRAINT IF EXISTS question_options_option_text_check;
ALTER TABLE question_options ADD CONSTRAINT question_options_content_required CHECK(length(trim(option_text)) > 0 OR media_url IS NOT NULL OR shape_type IS NOT NULL);

-- migrate:down
ALTER TABLE question_options DROP COLUMN IF EXISTS shape_color, DROP COLUMN IF EXISTS shape_type;
ALTER TABLE questions DROP COLUMN IF EXISTS shape_color, DROP COLUMN IF EXISTS shape_type;
