import type { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

export function serveStaticFiles(app: Hono) {
  const distPath = path.resolve(process.cwd(), "dist");

  app.use("*", serveStatic({ root: "./dist" }));

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    const indexPath = path.resolve(distPath, "index.html");
    const content = fs.readFileSync(indexPath, "utf-8");
    return c.html(content);
  });
}
