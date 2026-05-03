
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import path from "path";
import * as schema from "../db/schema.js";

// Mock env loading logic from api/lib/env.ts
config({ path: ".env.local" });
config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;
console.log("Using Database URL:", databaseUrl ? "Set (length " + databaseUrl.length + ")" : "NOT SET");

if (!databaseUrl) {
  console.error("DATABASE_URL is not set!");
  process.exit(1);
}

async function check() {
  try {
    const sql = neon(databaseUrl);
    const db = drizzle(sql, { schema });
    const results = await db.select().from(schema.artworks);
    console.log("Artworks count:", results.length);
    if (results.length > 0) {
      console.log("First artwork title:", results[0].title);
    }
    
    const users = await db.select().from(schema.users);
    console.log("Users count:", users.length);
    users.forEach(u => console.log(`- ${u.email} (${u.role})`));
    
  } catch (err) {
    console.error("Error connecting to database:", err);
  }
}

check();
