import { authRouter } from "./auth-router";
import { artworkRouter } from "./artwork-router";
import { orderRouter } from "./order-router";
import { contactRouter } from "./contact-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  artwork: artworkRouter,
  order: orderRouter,
  contact: contactRouter,
});

export type AppRouter = typeof appRouter;
