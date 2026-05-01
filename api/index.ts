import { Hono } from "hono";
import { handle } from "hono/vercel";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// ── IMPORT APP ROUTER & CONTEXT ──────────────────────────────────────────────
// Using relative imports with .js extension for Node.js ESM compatibility
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { put } from "@vercel/blob";

const app = new Hono();

// Global Logger & Pre-flight
app.use("*", async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`);
  await next();
});

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    message: "Shiva Vexarts API is stable",
    env_ok: !!process.env.DATABASE_URL && !!process.env.JWT_SECRET,
    timestamp: new Date().toISOString()
  });
});

// ── Image Upload (Vercel Blob) ───────────────────────────────────────────────
app.post("/api/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    if (!file) return c.json({ error: "No file uploaded" }, 400);

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
app.all("/api/trpc/*", async (c) => {
  try {
    return await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext,
    });
  } catch (err: any) {
    console.error("TRPC Crash:", err);
    return c.json({ error: "Internal TRPC Error", message: err.message }, 500);
  }
});

// ── Error Handling ───────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error("API CRASH:", err);
  return c.json({ 
    error: "Internal Server Error", 
    message: err.message,
    type: err.name 
  }, 500);
});

export default handle(app);
