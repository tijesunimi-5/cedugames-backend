import pool from "../config/database_connection";

export type ActivityInput = {
  eventType: string;
  title: string;
  description: string;
  actorId?: string | null;
  actorName?: string | null;
  metadata?: Record<string, unknown>;
};

/** Shared activity writer for product events administrators need to monitor. */
export async function logActivity(activity: ActivityInput): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO activity_logs(event_type,title,description,actor_id,actor_name,metadata)
       VALUES($1,$2,$3,$4,$5,$6)`,
      [activity.eventType, activity.title, activity.description, activity.actorId || null, activity.actorName || null, JSON.stringify(activity.metadata || {})],
    );
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "activity_log_failed", activityType: activity.eventType, message: error instanceof Error ? error.message : "Unknown error" }));
  }
}
