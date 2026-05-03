import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { artworks } from "../db/schema";

import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const artworkRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        collection: z.string().optional(),
        category: z.string().nullish(),
      }).optional()
    )
    .query(async ({ input }) => {
      console.log(`[ARTWORK] Listing artworks with filter:`, input);
      const db = getDb();
      const conditions = [];

      if (input?.collection) {
        conditions.push(eq(artworks.collection, input.collection));
      }
      if (input?.category && input.category !== "All") {
        conditions.push(eq(artworks.category, input.category));
      }

      let results;
      if (conditions.length > 0) {
        results = await db.select().from(artworks).where(and(...conditions)).orderBy(asc(artworks.id));
      } else {
        results = await db.select().from(artworks).orderBy(asc(artworks.id));
      }

      console.log(`[ARTWORK] Found ${results.length} artworks.`);
      return results;
    }),

  listAll: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(artworks).orderBy(asc(artworks.id));
  }),

  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1),
        category: z.string().min(1),
        collection: z.string().min(1),
        description: z.string().optional(),
        image: z.string().url(),
        basePrice: z.number().min(0),
        featured: z.number().optional().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can add artworks" });
      }

      const db = getDb();
      const slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);

      const [newArtwork] = await db.insert(artworks).values({
        ...input,
        slug,
      }).returning();

      return newArtwork;
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        category: z.string().optional(),
        collection: z.string().optional(),
        description: z.string().optional(),
        basePrice: z.number().optional(),
        featured: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update artworks" });
      }

      const db = getDb();
      await db
        .update(artworks)
        .set(input)
        .where(eq(artworks.id, input.id));

      return { success: true };
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
