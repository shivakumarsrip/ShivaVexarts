import { Hono } from "hono";
import { handle } from "hono/vercel";
import mainApp from "./boot";

// Entry point for Vercel Serverless Functions
const app = new Hono();

// Global Logger
app.use("*", async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`);
  await next();
});

// Priority Health Check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    message: "Shiva Vexarts API is active",
    timestamp: new Date().toISOString()
  });
});

// Mount Main App
app.route("/", mainApp);

// Error Handler
app.onError((err, c) => {
  console.error("Vercel Function Error:", err);
  return c.json({ 
    error: "Internal Server Error", 
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  }, 500);
});

export default handle(app);
