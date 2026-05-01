import * as jose from "jose";
import * as cookie from "cookie";
import { env } from "./env";
import { Session } from "../../contracts/constants";
import { Errors } from "../../contracts/errors";
import { findUserById } from "../queries/users";

const JWT_ALG = "HS256";

export type SessionPayload = {
  userId: number;
  role: "user" | "admin";
};

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.jwtSecret);
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.jwtSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const { userId, role } = payload;
    if (!userId || !role) return null;
    return { userId: userId as number, role: role as "user" | "admin" };
  } catch {
    return null;
  }
}

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) throw Errors.forbidden("Invalid authentication token.");
  const claim = await verifySessionToken(token);
  if (!claim) throw Errors.forbidden("Invalid authentication token.");
  const user = await findUserById(claim.userId);
  if (!user) throw Errors.forbidden("User not found. Please re-login.");
  return user;
}
