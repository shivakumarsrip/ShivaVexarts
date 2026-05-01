// ZERO top-level imports to prevent initialization crashes
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  try {
    const { Hono } = await import("hono");
    const { handle } = await import("hono/vercel");
    
    const app = new Hono();
    
    // Core check
    app.get("/api/health", (c) => c.json({ 
      status: "ok", 
      message: "Diagnostics active",
      node: process.version 
    }));

    // Diagnostic load of the router
    try {
      const { appRouter } = await import("./router.js");
      app.get("/api/test-router", (c) => c.json({ router: "loaded" }));
    } catch (routerErr: any) {
      res.statusCode = 500;
      return res.end(`ROUTER_LOAD_ERROR: ${routerErr.message}\n${routerErr.stack}`);
    }

    const honoHandler = handle(app);
    return await honoHandler(req, res);

  } catch (err: any) {
    res.statusCode = 500;
    return res.end(`BOOTSTRAP_ERROR: ${err.message}\n${err.stack}`);
  }
}
