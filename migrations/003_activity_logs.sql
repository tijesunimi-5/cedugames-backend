CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type varchar(80) NOT NULL,
  title varchar(160) NOT NULL,
  description text NOT NULL,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_name varchar(120),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_event_type_idx ON activity_logs(event_type);
CREATE INDEX IF NOT EXISTS activity_logs_actor_id_idx ON activity_logs(actor_id);
-- migrate:down
DROP TABLE IF EXISTS activity_logs;
