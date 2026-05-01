import { z } from "zod";
import * as bcrypt from "bcryptjs";
import * as cookie from "cookie";
import { TRPCError } from "@trpc/server";
import { Session } from "../contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { findUserByEmail, createUser } from "./queries/users";
import { signSessionToken } from "./lib/session";
import { env } from "./lib/env";

const BCRYPT_ROUNDS = 12;

export const authRouter = createRouter({
  // ── Who am I? ──────────────────────────────────────────────────
  me: authedQuery.query((opts) => opts.ctx.user),

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

      const existing = await findUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const hashed = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
      const isAdminEmail = input.email.toLowerCase() === env.adminEmail;
      
      const user = await createUser({
        email: input.email,
        password: hashed,
        name: input.name,
        role: isAdminEmail ? "admin" : "user",
      });

      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const token = await signSessionToken({ userId: user.id, role: user.role });
      const cookieOpts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: cookieOpts.httpOnly,
          path: cookieOpts.path,
          sameSite: (cookieOpts.sameSite?.toLowerCase() ?? "lax") as "lax" | "none",
          secure: cookieOpts.secure,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

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
      console.log(`[AUTH] Login attempt for: ${input.email}`);

      // Safety check for critical env variables
      if (!env.jwtSecret) {
        console.error("[AUTH] CRITICAL ERROR: JWT_SECRET is missing from environment variables.");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server configuration error. Please check environment variables.",
        });
      }

      const user = await findUserByEmail(input.email);
      if (!user) {
        console.warn(`[AUTH] Login failed: User not found (${input.email})`);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        console.warn(`[AUTH] Login failed: Invalid password for ${input.email}`);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      const token = await signSessionToken({ userId: user.id, role: user.role });
      const cookieOpts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: cookieOpts.httpOnly,
          path: cookieOpts.path,
          sameSite: (cookieOpts.sameSite?.toLowerCase() ?? "lax") as "lax" | "none",
          secure: cookieOpts.secure,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

      return { success: true, role: user.role };
    }),

  // ── Log out ────────────────────────────────────────────────────
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      })
    );
    return { success: true };
  }),
});
