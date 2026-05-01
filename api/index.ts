import { Hono } from "hono";
import { handle } from "hono/vercel";
import mainApp from "./boot";

const app = new Hono();

// Pre-flight check for Vercel Environment Variables
const validateEnv = () => {
  const missing = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  return missing;
};

// Health Check with Diagnostics
app.get("/api/health", (c) => {
  const missing = validateEnv();
  return c.json({
    status: missing.length === 0 ? "ok" : "degraded",
    message: "Shiva Vexarts API is online",
    missing_config: missing.length > 0 ? missing : undefined,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount the main application logic from boot.ts
app.route("/", mainApp);

// Robust Error Handler
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json({ 
    error: "Internal Server Error", 
    message: err.message || "An unknown error occurred",
    type: err.name
  }, 500);
});

export default handle(app);
