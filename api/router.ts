import { authRouter } from "./auth-router.js";
import { artworkRouter } from "./artwork-router.js";
import { orderRouter } from "./order-router.js";
import { contactRouter } from "./contact-router.js";
import { createRouter, publicQuery } from "./middleware.js";


export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  artwork: artworkRouter,
  order: orderRouter,
  contact: contactRouter,
});

export type AppRouter = typeof appRouter;
