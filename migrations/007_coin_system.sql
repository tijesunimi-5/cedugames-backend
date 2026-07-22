CREATE TABLE IF NOT EXISTS coin_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  description varchar(500) NOT NULL DEFAULT '',
  coins integer NOT NULL CHECK (coins > 0),
  price_minor integer NOT NULL CHECK (price_minor >= 0),
  currency char(3) NOT NULL DEFAULT 'NGN',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS coin_packages_name_lower_unique ON coin_packages(lower(name));
CREATE INDEX IF NOT EXISTS coin_packages_public_idx ON coin_packages(is_active, sort_order, coins);

CREATE TABLE IF NOT EXISTS coin_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  event_key varchar(80) NOT NULL,
  type varchar(16) NOT NULL CHECK (type IN ('reward', 'deduction')),
  amount integer NOT NULL CHECK (amount > 0),
  frequency varchar(20) NOT NULL DEFAULT 'per_event' CHECK (frequency IN ('once', 'daily', 'weekly', 'per_event')),
  description varchar(500) NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_key, type)
);
CREATE INDEX IF NOT EXISTS coin_rules_lookup_idx ON coin_rules(event_key, type, is_active);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(16) NOT NULL CHECK (type IN ('purchase', 'reward', 'deduction', 'adjustment')),
  amount integer NOT NULL CHECK (amount <> 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  description varchar(500) NOT NULL,
  reference varchar(160),
  package_id uuid REFERENCES coin_packages(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES coin_rules(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((type = 'deduction' AND amount < 0) OR (type <> 'deduction' AND amount > 0))
);
CREATE UNIQUE INDEX IF NOT EXISTS coin_transactions_reference_unique ON coin_transactions(reference) WHERE reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS coin_transactions_user_created_idx ON coin_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS coin_transactions_admin_created_idx ON coin_transactions(created_at DESC);

-- migrate:down
DROP TABLE IF EXISTS coin_transactions;
DROP TABLE IF EXISTS coin_rules;
DROP TABLE IF EXISTS coin_packages;
