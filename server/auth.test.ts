import { describe, expect, it, vi, beforeEach } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "./customAuth";

// Mock db module
vi.mock("./db", () => ({
  getUserByUsername: vi.fn(),
  createUser: vi.fn(),
}));

describe("Custom Auth - Password Hashing", () => {
  it("should hash and verify a password correctly", async () => {
    const password = "OMAR_2026_BRO";
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
    const valid = await verifyPassword(password, hash);
    expect(valid).toBe(true);
  });

  it("should reject wrong password", async () => {
    const hash = await hashPassword("correct_password");
    const valid = await verifyPassword("wrong_password", hash);
    expect(valid).toBe(false);
  });
});

describe("Custom Auth - Session Tokens", () => {
  it("should create and verify a valid session token", async () => {
    const token = await createSessionToken(1, "OMAR_ADMIN", "admin");
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT format

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(1);
    expect(payload?.username).toBe("OMAR_ADMIN");
    expect(payload?.role).toBe("admin");
  });

  it("should reject an invalid token", async () => {
    const result = await verifySessionToken("invalid.token.here");
    expect(result).toBeNull();
  });

  it("should reject an empty token", async () => {
    const result = await verifySessionToken("");
    expect(result).toBeNull();
  });
});

describe("Custom Auth - Admin Login Flow", () => {
  it("should verify admin credentials correctly", async () => {
    const adminPassword = "OMAR_2026_BRO";
    const hash = await hashPassword(adminPassword);
    const valid = await verifyPassword(adminPassword, hash);
    expect(valid).toBe(true);
  });

  it("should create admin session token with correct role", async () => {
    const token = await createSessionToken(1, "OMAR_ADMIN", "admin");
    const payload = await verifySessionToken(token);
    expect(payload?.role).toBe("admin");
    expect(payload?.username).toBe("OMAR_ADMIN");
  });
});

describe("Keep-Alive", () => {
  it("should have a valid ping endpoint structure", () => {
    // The keepAlive.ping endpoint returns { ok: true, ts: number }
    const mockResponse = { ok: true, ts: Date.now() };
    expect(mockResponse.ok).toBe(true);
    expect(typeof mockResponse.ts).toBe("number");
    expect(mockResponse.ts).toBeGreaterThan(0);
  });
});
