// Custom Auth SDK - replaces OAuth with username/password authentication
import { ForbiddenError } from "@shared/_core/errors";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import type { User } from "../../drizzle/schema";
import { getUserByUsername } from "../db";
import { COOKIE_NAME } from "../../shared/const";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const JWT_SECRET = process.env.JWT_SECRET || "omar-host-secret-2026";
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

class CustomAuthSDK {
  parseCookies(cookieHeader: string | undefined): Map<string, string> {
    const map = new Map<string, string>();
    if (!cookieHeader) return map;
    const parsed = parseCookieHeader(cookieHeader);
    for (const [k, v] of Object.entries(parsed)) {
      map.set(k, v);
    }
    return map;
  }

  async createSessionToken(userId: number, username: string, role: string): Promise<string> {
    return new SignJWT({ userId, username, role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("365d")
      .sign(getSecretKey());
  }

  async verifySession(token: string | undefined | null): Promise<{ userId: number; username: string; role: string } | null> {
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
      const { userId, username, role } = payload as Record<string, unknown>;
      if (typeof userId !== "number" || !isNonEmptyString(username) || !isNonEmptyString(role)) return null;
      return { userId, username, role };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await getUserByUsername(session.username);
    if (!user || !user.isActive) {
      throw ForbiddenError("User not found or inactive");
    }

    return user;
  }
}

export const sdk = new CustomAuthSDK();
export type { CustomAuthSDK };
