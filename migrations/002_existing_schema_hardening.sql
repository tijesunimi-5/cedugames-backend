ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_oauth boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 0;
ALTER TABLE otps ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE otps ALTER COLUMN otp_code TYPE varchar(64);

-- migrate:down
ALTER TABLE otps DROP COLUMN IF EXISTS failed_attempts;
ALTER TABLE users DROP COLUMN IF EXISTS token_version;
