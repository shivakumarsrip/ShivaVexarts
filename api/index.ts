import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { handle } from "@hono/node-server/vercel";
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
      console.log("[AUTH] STEP 1: Login started");
      const db = getDb();
      console.log("[AUTH] STEP 2: DB Instance ready");
      
      const userRows = await db.select().from(schema.users).where(eq(schema.users.email, input.email));
      console.log(`[AUTH] STEP 3: DB Query finished. Found ${userRows.length} users`);
      
      const user = userRows[0];
      if (!user) {
        console.log("[AUTH] STEP 4: User not found");
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }

      console.log("[AUTH] STEP 5: Starting bcrypt.compare...");
      const isMatch = await bcrypt.compare(input.password, user.password);
      console.log(`[AUTH] STEP 6: bcrypt finished. Match: ${isMatch}`);

      if (!isMatch) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }

      console.log("[AUTH] STEP 7: Starting JWT sign...");
      const token = await signSessionToken({ userId: user.id, role: user.role });
      console.log("[AUTH] STEP 8: JWT signed");

      ctx.resHeaders.append("set-cookie", cookie.serialize(Session.cookieName, token, { 
        httpOnly: true, path: "/", sameSite: "lax", secure: true, maxAge: Session.maxAgeMs / 1000 
      }));
      console.log("[AUTH] STEP 9: Cookie set. Done.");

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
        const conditions = [];
        if (input?.collection) conditions.push(eq(schema.artworks.collection, input.collection));
        if (input?.category && input.category !== "All") conditions.push(eq(schema.artworks.category, input.category));
        if (conditions.length) return db.select().from(schema.artworks).where(and(...conditions)).orderBy(asc(schema.artworks.id));
        return db.select().from(schema.artworks).orderBy(asc(schema.artworks.id));
      }),
    listAll: publicQuery.query(async () => getDb().select().from(schema.artworks).orderBy(asc(schema.artworks.id))),
    getBySlug: publicQuery.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const results = await getDb().select().from(schema.artworks).where(eq(schema.artworks.slug, input.slug));
      return results[0] || null;
    }),
    featured: publicQuery.query(async () => getDb().select().from(schema.artworks).where(eq(schema.artworks.featured, 1))),
    create: adminQuery.input(z.object({ title: z.string(), category: z.string(), collection: z.string(), description: z.string().optional(), image: z.string().url(), basePrice: z.number() }))
      .mutation(async ({ input }) => {
        const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-4);
        return (await getDb().insert(schema.artworks).values({ ...input, slug }).returning())[0];
      })
  }),

  order: t.router({
    create: publicQuery.input(z.object({ customerName: z.string(), customerEmail: z.string(), totalAmount: z.number(), items: z.array(z.any()) }))
      .mutation(async ({ input }) => {
        const orderId = "VEX-" + Date.now().toString(36).toUpperCase();
        const [order] = await getDb().insert(schema.orders).values({ orderId, ...input, status: "pending" }).returning();
        return { orderId, id: order.id };
      }),
    listAll: adminQuery.query(async () => getDb().select().from(schema.orders).orderBy(desc(schema.orders.createdAt)))
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

app.get("/api/health", (c) => c.json({ status: "ok", monolithic: "complete" }));


app.post("/api/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const blob = await put(file.name, file, { access: 'public', token: env.blobToken });
    return c.json(blob);
  } catch (err: any) { return c.json({ error: err.message }, 500); }
});

app.use("/api/trpc/*", async (c, next) => {
  const user = await authenticateRequest(c.req.raw.headers);
  return trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext: (_opts, honoCtx) => ({ 
      user, 
      req: honoCtx.req.raw, 
      resHeaders: honoCtx.res.headers 
    }),
  })(c, next);
});


export default handle(app);
