import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import * as bcrypt from "bcryptjs";
import * as cookie from "cookie";
import * as jose from "jose";
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
  get adminEmail() { return (process.env.ADMIN_EMAIL || "").toLowerCase(); }
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

const appRouter = t.router({
  ping: publicQuery.query(() => ({ ok: true })),
  auth: t.router({
    me: authedQuery.query((opts) => opts.ctx.user),
    login: publicQuery.input(z.object({ email: z.string().email(), password: z.string() })).mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = (await db.select().from(schema.users).where(eq(schema.users.email, input.email)))[0];
      if (!user || !(await bcrypt.compare(input.password, user.password))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      const token = await signSessionToken({ userId: user.id, role: user.role });
      ctx.resHeaders.append("set-cookie", cookie.serialize(Session.cookieName, token, { 
        httpOnly: true, path: "/", sameSite: "lax", secure: true, maxAge: Session.maxAgeMs / 1000 
      }));
      return { success: true, role: user.role };
    })
  }),
  artwork: t.router({
    list: publicQuery.query(async () => getDb().select().from(schema.artworks).orderBy(asc(schema.artworks.id)))
  })
});

// ── 5. HONO APP ──────────────────────────────────────────────────────────────
import { z } from "zod";
const app = new Hono();
app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.get("/api/health-hono", (c) => c.json({ status: "ok", type: "hono-monolithic" }));
app.get("/api/health", (c) => c.json({ status: "ok", monolithic: true }));

app.all("/api/trpc/*", async (c) => {
  const user = await authenticateRequest(c.req.raw.headers);
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({ user, req: c.req.raw, resHeaders: c.res.headers }),
  });
});

app.onError((err, c) => c.json({ error: "Internal Error", message: err.message }, 500));

export default handle(app);
