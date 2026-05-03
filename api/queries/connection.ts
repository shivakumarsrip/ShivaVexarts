import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { env } from "../lib/env";
import * as schema from "../../db/schema";
import * as relations from "../../db/relations";


const fullSchema = { ...schema, ...relations };
type Db = NeonHttpDatabase<typeof fullSchema>;

let instance: Db | null = null;

export function getDb() {
  if (!instance) {
    if (!env.databaseUrl) {
      console.error("[DB] DATABASE_URL is missing!");
      throw new Error("DATABASE_URL is not set in environment variables");
    }
    try {
      const sql = neon(env.databaseUrl);
      instance = drizzle(sql, { schema: fullSchema });
      console.log("[DB] Connection initialized.");
    } catch (err) {
      console.error("[DB] Failed to initialize connection:", err);
      throw err;
    }
  }
  return instance;
}
