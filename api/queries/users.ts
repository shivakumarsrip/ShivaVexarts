import { eq } from "drizzle-orm";
import * as schema from "../../db/schema.js";
import { getDb } from "./connection.js";


export async function findUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);
  return rows[0];
}

export async function findUserById(id: number) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows[0];
}

export async function updateUserPassword(id: number, password: string) {
  await getDb()
    .update(schema.users)
    .set({ password, updatedAt: new Date() })
    .where(eq(schema.users.id, id));
}

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
  role: "user" | "admin";
}) {
  const email = data.email.toLowerCase();

  await getDb()
    .insert(schema.users)
    .values({
      email,
      password: data.password,
      name: data.name,
      role: data.role,
    });

  // Return the newly created user
  return findUserByEmail(email);
}
