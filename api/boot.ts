import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./router";
import { authenticateRequest } from "./lib/session.js";
import { put } from "@vercel/blob";

const app = new Hono();

// Apply body limit to all routes
app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// ── Stable Health Check ─────────────────────────────────────────────────────
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    message: "Hono is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ── Image Upload (Vercel Blob) ───────────────────────────────────────────────
app.post("/api/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const blob = await put(file.name, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return c.json(blob);
  } catch (error: any) {
    console.error("Upload error:", error);
    return c.json({ error: error.message || "Upload failed" }, 500);
  }
});

// ── TRPC Adapter ─────────────────────────────────────────────────────────────
app.use("/api/trpc/*", async (c, next) => {
  let user = null;
  try {
    user = await authenticateRequest(c.req.raw.headers);
  } catch {
    // Public tRPC procedures, including login and gallery reads, must still run
    // when the request has no valid session cookie.
  }

  return trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext: (_opts, honoCtx) => ({
      user,
      req: honoCtx.req.raw,
      resHeaders: _opts.resHeaders,
      honoCtx,
    }),
  })(c, next);
});

// ── Debug Auth Endpoint ──────────────────────────────────────────────────────
app.get("/api/debug-auth", async (c) => {
  const { getDb } = await import("./queries/connection");
  const { env } = await import("./lib/env");
  
  try {
    const db = getDb();
    const result = await db.execute("SELECT 1 as connected");
    return c.json({
      db_connected: true,
      jwt_secret_present: !!env.jwtSecret,
      env_keys: Object.keys(process.env).filter(k => k.includes("URL") || k.includes("TOKEN")),
      db_test: result
    });
  } catch (err: any) {
    return c.json({
      db_connected: false,
      error: err.message,
      stack: err.stack
    }, 500);
  }
});

// ── Fallback ─────────────────────────────────────────────────────────────────
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));


export default app;
