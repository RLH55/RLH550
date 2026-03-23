import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  hostingAccounts,
  fileUploads,
  activityLogs,
  InsertUser,
  InsertHostingAccount,
  InsertFileUpload,
  InsertActivityLog,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0] ?? undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function createUser(data: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(users).values(data);
  return getUserByUsername(data.username);
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(users).where(eq(users.id, id));
}

// ─── Hosting Accounts ─────────────────────────────────────────────────────────

export async function getHostingAccountByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(hostingAccounts)
    .where(eq(hostingAccounts.userId, userId))
    .limit(1);
  return result[0] ?? undefined;
}

export async function getAllHostingAccounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hostingAccounts).orderBy(desc(hostingAccounts.createdAt));
}

export async function createHostingAccount(data: InsertHostingAccount) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(hostingAccounts).values(data);
  return getHostingAccountByUserId(data.userId);
}

export async function updateHostingAccount(id: number, data: Partial<InsertHostingAccount>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(hostingAccounts).set(data).where(eq(hostingAccounts.id, id));
}

// ─── File Uploads ─────────────────────────────────────────────────────────────

export async function createFileUpload(data: InsertFileUpload) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(fileUploads).values(data);
}

export async function getFileUploadsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(fileUploads)
    .where(eq(fileUploads.userId, userId))
    .orderBy(desc(fileUploads.createdAt));
}

export async function getAllFileUploads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fileUploads).orderBy(desc(fileUploads.createdAt));
}

export async function markTelegramSent(id: number, messageId: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(fileUploads)
    .set({ telegramSent: true, telegramMessageId: messageId })
    .where(eq(fileUploads.id, id));
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export async function createActivityLog(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values(data);
}

export async function getActivityLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

export async function getActivityLogsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(50);
}
