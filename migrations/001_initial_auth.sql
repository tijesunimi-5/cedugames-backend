CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  username varchar(40) NOT NULL,
  email varchar(320) NOT NULL,
  password text,
  age integer CHECK (age IS NULL OR age BETWEEN 1 AND 130),
  role varchar(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  total_xp integer NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  coins_count integer NOT NULL DEFAULT 100 CHECK (coins_count >= 0),
  lives_remaining integer NOT NULL DEFAULT 3 CHECK (lives_remaining >= 0),
  is_verified boolean NOT NULL DEFAULT false,
  is_oauth boolean NOT NULL DEFAULT false,
  token_version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique ON users (lower(username));

CREATE TABLE IF NOT EXISTS otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL,
  otp_code varchar(64) NOT NULL,
  purpose varchar(30) NOT NULL CHECK (purpose IN ('register', 'password_reset')),
  expires_at timestamptz NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, purpose)
);

CREATE INDEX IF NOT EXISTS otps_expiry_idx ON otps (expires_at);

-- migrate:down
DROP TABLE IF EXISTS otps;
DROP TABLE IF EXISTS users;
