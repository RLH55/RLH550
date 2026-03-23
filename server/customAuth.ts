import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { getUserByUsername, createUser } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "../shared/const";

const JWT_SECRET = process.env.JWT_SECRET || "omar-host-secret-2026";
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: number, username: string, role: string): Promise<string> {
  return new SignJWT({ userId, username, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<{ userId: number; username: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    const { userId, username, role } = payload as Record<string, unknown>;
    if (typeof userId !== "number" || typeof username !== "string" || typeof role !== "string") return null;
    return { userId, username, role };
  } catch {
    return null;
  }
}

export async function authenticateCustomRequest(req: Request) {
  const cookies = req.headers.cookie
    ? Object.fromEntries(req.headers.cookie.split(";").map((c) => c.trim().split("=").map(decodeURIComponent)))
    : {};
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const user = await getUserByUsername(session.username);
  if (!user || !user.isActive) return null;
  return user;
}

// Seed admin account on startup
export async function seedAdminAccount() {
  try {
    const existing = await getUserByUsername("OMAR_ADMIN");
    if (!existing) {
      const passwordHash = await hashPassword("OMAR_2026_BRO");
      await createUser({
        username: "OMAR_ADMIN",
        passwordHash,
        role: "admin",
        isActive: true,
      });
      console.log("[Auth] Admin account created: OMAR_ADMIN");
    }
  } catch (err) {
    console.error("[Auth] Failed to seed admin:", err);
  }
}
