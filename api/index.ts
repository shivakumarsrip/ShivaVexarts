import { handle } from "hono/vercel";
import app from "./boot";

// Use standard Node.js runtime instead of Edge to support all libraries
export const config = {
  runtime: "nodejs20.x",
};

export default handle(app);
