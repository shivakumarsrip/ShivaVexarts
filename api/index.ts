import { handle } from "hono/vercel";
import app from "./boot";

// Vercel standard Node.js runtime
export const config = {
  runtime: "nodejs",
};

export default handle(app);
