import { Hono } from "hono";
import { handle } from "hono/vercel";
import mainApp from "./boot";

// Entry point for Vercel Serverless Functions
const app = new Hono();

// Pre-flight validation to ensure critical secrets are present
const validateEnv = () => {
  const missing = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  return missing;
};

// Global Logger
app.use("*", async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`);
  const missing = validateEnv();
  if (missing.length > 0) {
    console.error("MISSING ENV VARS:", missing);
  }
  await next();
});

// Priority Health Check
app.get("/api/health", (c) => {
  const missing = validateEnv();
  return c.json({
    status: missing.length === 0 ? "ok" : "degraded",
    message: "Shiva Vexarts API",
    missing_config: missing.length > 0 ? missing : undefined,
    timestamp: new Date().toISOString()
  });
});

// Mount Main App
app.route("/", mainApp);

// Error Handler - ENSURE JSON IS ALWAYS RETURNED
app.onError((err, c) => {
  console.error("Vercel Function Error:", err);
  return c.json({ 
    error: "Internal Server Error", 
    message: err.message || "Unknown error",
    type: err.name,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  }, 500);
});

export default handle(app);

