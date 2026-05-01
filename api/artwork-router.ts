import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { artworks } from "../db/schema";
import { eq, and, asc } from "drizzle-orm";

export const artworkRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        collection: z.enum(["movie_posters", "social_awareness", "digital_illustrations"]).optional(),
        category: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.collection) {
        conditions.push(eq(artworks.collection, input.collection));
      }
      if (input?.category && input.category !== "All") {
        conditions.push(eq(artworks.category, input.category));
      }

      if (conditions.length > 0) {
        return db.select().from(artworks).where(and(...conditions)).orderBy(asc(artworks.id));
      }

      return db.select().from(artworks).orderBy(asc(artworks.id));
    }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db.select().from(artworks).where(eq(artworks.slug, input.slug));
      return results[0] || null;
    }),

  featured: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(artworks).where(eq(artworks.featured, 1));
  }),
});
