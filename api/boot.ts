import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { put } from "@vercel/blob";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./router";
import { env } from "./lib/env";
import { authenticateRequest } from "./lib/session";

const app = new Hono();

app.use("/api/*", cors({
  origin: (origin) => origin,
  credentials: true,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-trpc-source"],
}));

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    env: env.isProduction ? "production" : "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/config-check", (c) => {
  return c.json({
    database: Boolean(env.databaseUrl),
    jwt: Boolean(env.jwtSecret),
    blobStorage: Boolean(env.blobReadWriteToken),
    assetBaseUrl: env.publicAssetBaseUrl || "static-public-assets",
  });
});

app.post("/api/upload", async (c) => {
  try {
    const user = await authenticateRequest(c.req.raw.headers);
    if (user.role !== "admin") {
      return c.json({ error: "Only admins can upload artwork images" }, 403);
    }

    if (!env.blobReadWriteToken) {
      return c.json({ error: "Blob storage is not configured" }, 500);
    }

    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const blob = await put(`artworks/${Date.now()}-${safeName}`, file, {
      access: "public",
      token: env.blobReadWriteToken,
    });

    return c.json(blob);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("Upload error:", error);
    return c.json({ error: message }, 500);
  }
});

app.all("/api/trpc/:path*", async (c, next) => {
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
    createContext: (opts, honoCtx) => ({
      user,
      req: honoCtx.req.raw,
      resHeaders: opts.resHeaders,
      honoCtx,
    }),
  })(c, next);
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
