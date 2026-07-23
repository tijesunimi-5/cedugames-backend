CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(160) NOT NULL,
  message text NOT NULL,
  type varchar(30) NOT NULL DEFAULT 'announcement' CHECK(type IN ('announcement','achievement','reminder','system')),
  audience varchar(30) NOT NULL DEFAULT 'all' CHECK(audience IN ('all','verified','unverified')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by_name varchar(120),
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_delivery_idx ON notifications(published_at DESC,audience);

CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(notification_id,user_id)
);
CREATE INDEX IF NOT EXISTS notification_reads_user_idx ON notification_reads(user_id,read_at DESC);

-- migrate:down
DROP TABLE IF EXISTS notification_reads;
DROP TABLE IF EXISTS notifications;
