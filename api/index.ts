import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono();

// ── Super Simple Health Check ───────────────────────────────────────────────
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    message: "Hono is alive and isolated!",
    vercel: true,
    timestamp: new Date().toISOString()
  });
});

// ── We will re-import the main app once we verify this works ───────────────
// import mainApp from "./boot";
// app.route("/", mainApp);

export const config = {
  runtime: "nodejs",
};

export default handle(app);
