import "dotenv/config";
import { app } from "./app";
import pool from "./config/database_connection";
import { env } from "./config/env";

const server = app.listen(env.PORT, () => console.log(JSON.stringify({ level: "info", event: "server_started", port: env.PORT })));
const shutdown = (signal: string) => {
  console.log(JSON.stringify({ level: "info", event: "shutdown_started", signal }));
  server.close(async () => { await pool.end(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
