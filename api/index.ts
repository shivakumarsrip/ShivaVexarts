import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import * as bcrypt from "bcryptjs";
import * as cookie from "cookie";
import * as jose from "jose";
import { z } from "zod";
import { put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, asc, desc } from "drizzle-orm";
import * as schema from "../db/schema.js";

// ── 1. CONFIG & CONSTANTS ───────────────────────────────────────────────────
const Session = { cookieName: "sv_sid", maxAgeMs: 365 * 24 * 60 * 60 * 1000 };
const ErrorMessages = { unauthenticated: "Authentication required", insufficientRole: "Insufficient permissions" };
const JWT_ALG = "HS256";

const env = {
  get jwtSecret() { return process.env.JWT_SECRET || ""; },
  get databaseUrl() { return process.env.DATABASE_URL || ""; },
  get adminEmail() { return (process.env.ADMIN_EMAIL || "").toLowerCase(); },
  get blobToken() { return process.env.BLOB_READ_WRITE_TOKEN || ""; }
};

// ── 2. DATABASE CONNECTION ──────────────────────────────────────────────────
let dbInstance: any = null;
function getDb() {
  if (!dbInstance) {
    if (!env.databaseUrl) throw new Error("DATABASE_URL is missing");
    const sql = neon(env.databaseUrl);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

// ── 3. AUTH UTILS ────────────────────────────────────────────────────────────
async function signSessionToken(payload: any) {
  const secret = new TextEncoder().encode(env.jwtSecret);
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(secret);
}

async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.jwtSecret);
    const { payload } = await jose.jwtVerify(token, secret);
    const db = getDb();
    const rows = await db.select().from(schema.users).where(eq(schema.users.id, (payload as any).userId));
    return rows[0] || null;
  } catch { return null; }
}

// ── 4. TRPC SETUP ────────────────────────────────────────────────────────────
const t = initTRPC.context<{ user?: any; req: Request; resHeaders: Headers }>().create({ transformer: superjson });
const publicQuery = t.procedure;
const authedQuery = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: ErrorMessages.unauthenticated });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
const adminQuery = authedQuery.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: ErrorMessages.insufficientRole });
  return next({ ctx });
});

const appRouter = t.router({
  ping: publicQuery.query(() => ({ ok: true })),
  auth: t.router({
    me: authedQuery.query((opts) => opts.ctx.user),
    login: publicQuery.input(z.object({ email: z.string().email(), password: z.string() })).mutation(async ({ input, ctx }) => {
      console.log(`[AUTH] 1. Login attempt started for: ${input.email}`);
      
      console.log("[AUTH] 2. Initializing DB connection...");
      const db = getDb();
      
      console.log("[AUTH] 3. Searching for user in database...");
      const users = await db.select().from(schema.users).where(eq(schema.users.email, input.email));
      const user = users[0];
      
      if (!user) {
        console.warn("[AUTH] 4a. User not found");
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      
      console.log("[AUTH] 4b. User found. Comparing password hash...");
      const isMatch = await bcrypt.compare(input.password, user.password);
      
      if (!isMatch) {
        console.warn("[AUTH] 5a. Password mismatch");
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      
      console.log("[AUTH] 5b. Password matched. Signing JWT...");
      const token = await signSessionToken({ userId: user.id, role: user.role });
      
      console.log("[AUTH] 6. Setting session cookie...");
      ctx.resHeaders.append("set-cookie", cookie.serialize(Session.cookieName, token, { 
        httpOnly: true, path: "/", sameSite: "lax", secure: true, maxAge: Session.maxAgeMs / 1000 
      }));
      
      console.log("[AUTH] 7. Login successful!");
      return { success: true, role: user.role };
    }),

    logout: authedQuery.mutation(({ ctx }) => {
      ctx.resHeaders.append("set-cookie", cookie.serialize(Session.cookieName, "", { path: "/", maxAge: 0 }));
      return { success: true };
    })
  }),
  artwork: t.router({
    list: publicQuery.input(z.object({ collection: z.string().optional(), category: z.string().nullish() }).optional())
      .query(async ({ input }) => {
        const db = getDb();
        let q = db.select().from(schema.artworks);
        const conditions = [];
        if (input?.collection) conditions.push(eq(schema.artworks.collection, input.collection));
        if (input?.category && input.category !== "All") conditions.push(eq(schema.artworks.category, input.category));
        if (conditions.length) return q.where(and(...conditions)).orderBy(asc(schema.artworks.id));
        return q.orderBy(asc(schema.artworks.id));
      }),
    getBySlug: publicQuery.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const results = await getDb().select().from(schema.artworks).where(eq(schema.artworks.slug, input.slug));
      return results[0] || null;
    })
  }),
  contact: t.router({
    submit: publicQuery.input(z.object({ name: z.string(), email: z.string(), subject: z.string(), message: z.string() }))
      .mutation(async ({ input }) => {
        await getDb().insert(schema.contacts).values(input);
        return { success: true };
      })
  })
});

// ── 5. HONO APP ──────────────────────────────────────────────────────────────
const app = new Hono();
app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.get("/api/health", (c) => c.json({ status: "ok", monolithic: "fixed", node: process.version }));

app.post("/api/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const blob = await put(file.name, file, { access: 'public', token: env.blobToken });
    return c.json(blob);
  } catch (err: any) { return c.json({ error: err.message }, 500); }
});

app.all("/api/trpc/*", async (c) => {
  const user = await authenticateRequest(c.req.raw.headers);
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({ user, req: c.req.raw, resHeaders: c.res.headers }),
  });
});

export default handle(app);
