import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";

const app = new Hono();
app.get("/api/test", (c) => c.text("API is working!"));

export default handle(app);
// import app from "./boot";
// console.log("[SYSTEM] API Entry point invoked.");
// export default handle(app);
