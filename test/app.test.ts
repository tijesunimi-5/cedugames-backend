import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "../src/app";
import pool from "../src/config/database_connection";

afterAll(async () => { await pool.end(); });

describe("application shell", () => {
  it("reports liveness without requiring the database", async () => {
    const response = await request(app).get("/health/live");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-request-id"]).toBeTruthy();
  });

  it("returns a JSON 404", async () => {
    const response = await request(app).get("/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("rejects malformed JSON", async () => {
    const response = await request(app).post("/auth/login").set("content-type", "application/json").send('{"email":');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid JSON payload.");
  });
});
