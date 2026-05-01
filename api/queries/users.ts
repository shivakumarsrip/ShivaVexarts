import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export async function findUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);
  return rows.at(0);
}

export async function findUserById(id: number) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows.at(0);
}

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
}) {
  const email = data.email.toLowerCase();
  const role = email === env.adminEmail && env.adminEmail !== "" ? "admin" : "user";

  await getDb()
    .insert(schema.users)
    .values({
      email,
      password: data.password,
      name: data.name,
      role,
    });

  // Return the newly created user
  return findUserByEmail(email);
}
