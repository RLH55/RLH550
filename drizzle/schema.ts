import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  bigint,
  boolean,
} from "drizzle-orm/mysql-core";

// ─── Admin & Users ────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Hosting Accounts ─────────────────────────────────────────────────────────

export const hostingAccounts = mysqlTable("hosting_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  maxServers: int("maxServers").default(1).notNull(),
  daysAllowed: int("daysAllowed").default(30).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HostingAccount = typeof hostingAccounts.$inferSelect;
export type InsertHostingAccount = typeof hostingAccounts.$inferInsert;

// ─── File Uploads ─────────────────────────────────────────────────────────────

export const fileUploads = mysqlTable("file_uploads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  username: varchar("username", { length: 64 }).notNull(),
  filename: varchar("filename", { length: 512 }).notNull(),
  originalName: varchar("originalName", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  fileSize: bigint("fileSize", { mode: "number" }),
  telegramSent: boolean("telegramSent").default(false).notNull(),
  telegramMessageId: varchar("telegramMessageId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = typeof fileUploads.$inferInsert;

// ─── Activity Logs ────────────────────────────────────────────────────────────

export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  username: varchar("username", { length: 64 }),
  action: varchar("action", { length: 128 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
