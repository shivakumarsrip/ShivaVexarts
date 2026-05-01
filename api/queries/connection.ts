import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { env } from "../lib/env";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";


const fullSchema = { ...schema, ...relations };
type Db = NeonHttpDatabase<typeof fullSchema>;

let instance: Db | null = null;

export function getDb() {
  if (!instance) {
    if (!env.databaseUrl) {
      throw new Error("DATABASE_URL is not set in environment variables");
    }
    const sql = neon(env.databaseUrl);
    instance = drizzle(sql, { schema: fullSchema });
  }
  return instance;
}
