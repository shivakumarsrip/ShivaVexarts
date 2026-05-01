import { serve } from "@hono/node-server";
import app from "./boot.js";
import { serveStaticFiles } from "./lib/vite.js";

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
