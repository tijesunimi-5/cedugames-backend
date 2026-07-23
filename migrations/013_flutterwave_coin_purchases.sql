CREATE TABLE IF NOT EXISTS coin_purchase_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES coin_packages(id) ON DELETE RESTRICT,
  tx_ref varchar(160) NOT NULL UNIQUE,
  amount_minor integer NOT NULL CHECK (amount_minor > 0),
  currency char(3) NOT NULL,
  coins integer NOT NULL CHECK (coins > 0),
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  flutterwave_transaction_id bigint UNIQUE,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coin_purchase_intents_user_created_idx
  ON coin_purchase_intents(user_id, created_at DESC);

-- migrate:down
DROP TABLE IF EXISTS coin_purchase_intents;
