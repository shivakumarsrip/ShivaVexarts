import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import "dotenv/config"; // Ensure .env is loaded locally

const app = new Hono();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Health Check Endpoint for Debugging
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    environment: process.env.NODE_ENV || "unknown",
    checks: {
      database_url: !!env.databaseUrl,
      jwt_secret: !!env.jwtSecret,
      admin_email: !!env.adminEmail,
    },
    timestamp: new Date().toISOString()
  });
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
