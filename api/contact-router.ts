import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { contacts } from "../db/schema.js";

import { desc } from "drizzle-orm";

export const contactRouter = createRouter({
  submit: publicQuery
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        subject: z.string().min(1, "Subject is required"),
        message: z.string().min(10, "Message must be at least 10 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(contacts).values({
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
      });
      return { success: true };
    }),

  listAll: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }),
});
