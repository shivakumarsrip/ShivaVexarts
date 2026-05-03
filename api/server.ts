import { serve } from "@hono/node-server";
import app from "./boot";
import { serveStaticFiles } from "./lib/vite";

const port = Number(process.env.PORT || 3000);

serveStaticFiles(app);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.info(`Server listening on http://localhost:${info.port}`);
  },
);
