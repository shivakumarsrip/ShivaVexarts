import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono();

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    message: "Minimal API is working",
    node_version: process.version,
    timestamp: new Date().toISOString()
  });
});

export default handle(app);
