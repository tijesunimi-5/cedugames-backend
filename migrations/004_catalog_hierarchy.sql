CREATE TABLE IF NOT EXISTS age_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL,
  min_age integer NOT NULL CHECK(min_age > 0), max_age integer NOT NULL CHECK(max_age >= min_age),
  subtitle varchar(180) NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', image_url text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(min_age,max_age)
);
CREATE TABLE IF NOT EXISTS game_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), age_group_id uuid NOT NULL REFERENCES age_groups(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL, description text NOT NULL DEFAULT '', image_url text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(age_group_id,name)
);
CREATE TABLE IF NOT EXISTS game_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), category_id uuid NOT NULL REFERENCES game_categories(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL, level_number integer NOT NULL CHECK(level_number > 0), description text NOT NULL DEFAULT '', image_url text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id,level_number)
);
INSERT INTO age_groups(name,min_age,max_age,subtitle,description) VALUES
('Little Explorers',3,5,'Learn through fun and play!','Discover colors, shapes, animals, and numbers with simple games that make learning exciting and easy to understand.'),
('Young Thinkers',6,8,'Solve, build, and explore!','Play games that boost creativity, problem-solving, and memory through words, math, and science.'),
('Smart Adventurers',9,11,'Challenge your mind!','Dive into brain games, quizzes, and creative missions that test logic, teamwork, and curiosity.')
ON CONFLICT(min_age,max_age) DO NOTHING;
-- migrate:down
DROP TABLE IF EXISTS game_levels;
DROP TABLE IF EXISTS game_categories;
DROP TABLE IF EXISTS age_groups;
