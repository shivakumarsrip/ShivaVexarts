import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
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
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// ── Fallback ─────────────────────────────────────────────────────────────────
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
