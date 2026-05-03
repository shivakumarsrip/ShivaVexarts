import { z } from "zod";
import bcrypt from "bcryptjs";
import { setCookie, deleteCookie } from "hono/cookie";
import * as cookie from "cookie";
import type { Context } from "hono";
import { TRPCError } from "@trpc/server";
import { Session } from "../contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { findUserByEmail, createUser, updateUserPassword } from "./queries/users";
import { signSessionToken } from "./lib/session";
import { env } from "./lib/env";


const BCRYPT_ROUNDS = 12;

function isBcryptHash(password: string) {
  return /^\$2[aby]\$\d{2}\$/.test(password);
}

function setSessionCookie(ctx: { req: Request; resHeaders?: Headers; honoCtx?: Context }, token: string) {
  const cookieOpts = getSessionCookieOptions(ctx.req.headers);
  const options = {
    httpOnly: cookieOpts.httpOnly,
    path: cookieOpts.path,
    sameSite: (cookieOpts.sameSite?.toLowerCase() ?? "lax") as "lax" | "none",
    secure: cookieOpts.secure,
    maxAge: Session.maxAgeMs / 1000,
  };

  ctx.resHeaders?.append("set-cookie", cookie.serialize(Session.cookieName, token, options));
  if (ctx.honoCtx) setCookie(ctx.honoCtx, Session.cookieName, token, options);
}

function clearSessionCookie(ctx: { req: Request; resHeaders?: Headers; honoCtx?: Context }) {
  const opts = getSessionCookieOptions(ctx.req.headers);
  const options = {
    path: opts.path,
    sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
    secure: opts.secure,
  };

  ctx.resHeaders?.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, "", {
      ...options,
      httpOnly: opts.httpOnly,
      maxAge: 0,
    }),
  );
  if (ctx.honoCtx) deleteCookie(ctx.honoCtx, Session.cookieName, options);
}

function toPublicUser<T extends { password: string }>(user: T) {
  const { password, ...publicUser } = user;
  void password;
  return publicUser;
}

export const authRouter = createRouter({
  // ── Who am I? ──────────────────────────────────────────────────
  me: authedQuery.query((opts) => toPublicUser(opts.ctx.user)),

  // ── Sign up ────────────────────────────────────────────────────
  signup: publicQuery
    .input(
      z.object({
        email: z.string().email("Please enter a valid email"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Safety check for critical env variables
      if (!env.jwtSecret) {
        console.error("CRITICAL ERROR: JWT_SECRET is missing from environment variables.");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server configuration error. Please check environment variables.",
        });
      }

      const email = input.email.trim().toLowerCase();
      const existing = await findUserByEmail(email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const hashed = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
      const isAdminEmail = email === env.adminEmail;
      
      const user = await createUser({
        email,
        password: hashed,
        name: input.name?.trim(),
        role: isAdminEmail ? "admin" : "user",
      });

      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const token = await signSessionToken({ userId: user.id, role: user.role });
      setSessionCookie(ctx, token);

      return { success: true, role: user.role };
    }),

  // ── Log in ─────────────────────────────────────────────────────
  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      console.log(`[AUTH] Login attempt for: ${email}`);

      // Safety check for critical env variables
      if (!env.jwtSecret) {
        console.error("[AUTH] CRITICAL ERROR: JWT_SECRET is missing from environment variables.");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server configuration error. Please check environment variables.",
        });
      }

      try {
        const user = await findUserByEmail(email);
        if (!user) {
          console.warn(`[AUTH] Login failed: User not found (${email})`);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        const valid = isBcryptHash(user.password)
          ? await bcrypt.compare(input.password, user.password)
          : input.password === user.password;
        if (!valid) {
          console.warn(`[AUTH] Login failed: Invalid password for ${email}`);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        if (!isBcryptHash(user.password)) {
          const hashed = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
          await updateUserPassword(user.id, hashed);
        }

        const token = await signSessionToken({ userId: user.id, role: user.role });
        setSessionCookie(ctx, token);

        console.log(`[AUTH] Login success: ${email} (${user.role})`);
        return { success: true, role: user.role };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error(`[AUTH] Unexpected error during login for ${email}:`, err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred during login.",
        });
      }
    }),

  // ── Log out ────────────────────────────────────────────────────
  logout: authedQuery.mutation(async ({ ctx }) => {
    clearSessionCookie(ctx);
    return { success: true };
  }),
});
