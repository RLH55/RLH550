import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure as trpcAdminProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import {
  getUserByUsername,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getHostingAccountByUserId,
  getAllHostingAccounts,
  createHostingAccount,
  updateHostingAccount,
  createFileUpload,
  getFileUploadsByUserId,
  getAllFileUploads,
  markTelegramSent,
  createActivityLog,
  getActivityLogs,
  getActivityLogsByUserId,
} from "./db";
import { hashPassword, verifyPassword, seedAdminAccount } from "./customAuth";
import { storagePut } from "./storage";
import { sendTelegramDocument, notifyNewUser, notifyFileUpload } from "./telegram";
import { nanoid } from "nanoid";

// Seed admin on startup
seedAdminAccount().catch(console.error);

const adminProcedure = trpcAdminProcedure;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    login: publicProcedure
      .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByUsername(input.username);
        if (!user || !user.isActive) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
        }
        const valid = await verifyPassword(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
        }
        const token = await sdk.createSessionToken(user.id, user.username, user.role);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        await createActivityLog({
          userId: user.id,
          username: user.username,
          action: "login",
          details: "تسجيل دخول ناجح",
          ipAddress: ctx.req.ip,
        });

        return { success: true, role: user.role, username: user.username };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    // Get all users with hosting info
    getUsers: adminProcedure.query(async () => {
      const allUsers = await getAllUsers();
      const accounts = await getAllHostingAccounts();
      return allUsers.map((u) => {
        const account = accounts.find((a) => a.userId === u.id);
        return {
          ...u,
          passwordHash: undefined,
          hosting: account || null,
        };
      });
    }),

    // Create user
    createUser: adminProcedure
      .input(
        z.object({
          username: z.string().min(3).max(64),
          password: z.string().min(6),
          maxServers: z.number().int().min(1).max(100),
          daysAllowed: z.number().int().min(1).max(3650),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByUsername(input.username);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "اسم المستخدم موجود مسبقاً" });
        }
        const passwordHash = await hashPassword(input.password);
        const newUser = await createUser({ username: input.username, passwordHash, role: "user", isActive: true });
        if (!newUser) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const expiresAt = new Date(Date.now() + input.daysAllowed * 24 * 60 * 60 * 1000);
        await createHostingAccount({
          userId: newUser.id,
          maxServers: input.maxServers,
          daysAllowed: input.daysAllowed,
          expiresAt,
        });

        await createActivityLog({
          userId: (ctx.user as any).id,
          username: (ctx.user as any).username,
          action: "create_user",
          details: `أنشأ حساب: ${input.username} | سيرفرات: ${input.maxServers} | أيام: ${input.daysAllowed}`,
        });

        // Notify via Telegram
        notifyNewUser(input.username, input.maxServers, input.daysAllowed).catch(console.error);

        return { success: true, userId: newUser.id };
      }),

    // Update user
    updateUser: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          username: z.string().min(3).max(64).optional(),
          password: z.string().min(6).optional(),
          isActive: z.boolean().optional(),
          maxServers: z.number().int().min(1).max(100).optional(),
          daysAllowed: z.number().int().min(1).max(3650).optional(),
          extendDays: z.number().int().min(1).max(3650).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(input.userId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });

        const userUpdate: Record<string, unknown> = {};
        if (input.username) userUpdate.username = input.username;
        if (input.password) userUpdate.passwordHash = await hashPassword(input.password);
        if (input.isActive !== undefined) userUpdate.isActive = input.isActive;
        if (Object.keys(userUpdate).length > 0) await updateUser(input.userId, userUpdate as any);

        const account = await getHostingAccountByUserId(input.userId);
        if (account) {
          const accountUpdate: Record<string, unknown> = {};
          if (input.maxServers !== undefined) accountUpdate.maxServers = input.maxServers;
          if (input.daysAllowed !== undefined) {
            accountUpdate.daysAllowed = input.daysAllowed;
            accountUpdate.expiresAt = new Date(Date.now() + input.daysAllowed * 24 * 60 * 60 * 1000);
          }
          if (input.extendDays !== undefined) {
            const currentExpiry = account.expiresAt > new Date() ? account.expiresAt : new Date();
            accountUpdate.expiresAt = new Date(currentExpiry.getTime() + input.extendDays * 24 * 60 * 60 * 1000);
          }
          if (Object.keys(accountUpdate).length > 0) await updateHostingAccount(account.id, accountUpdate as any);
        }

        await createActivityLog({
          userId: (ctx.user as any).id,
          username: (ctx.user as any).username,
          action: "update_user",
          details: `عدّل حساب: ${user.username}`,
        });

        return { success: true };
      }),

    // Delete user
    deleteUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(input.userId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        if (user.role === "admin") throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن حذف حساب الأدمن" });

        await deleteUser(input.userId);

        await createActivityLog({
          userId: (ctx.user as any).id,
          username: (ctx.user as any).username,
          action: "delete_user",
          details: `حذف حساب: ${user.username}`,
        });

        return { success: true };
      }),

    // Get stats
    getStats: adminProcedure.query(async () => {
      const allUsers = await getAllUsers();
      const accounts = await getAllHostingAccounts();
      const files = await getAllFileUploads();
      const now = new Date();
      const activeAccounts = accounts.filter((a) => a.expiresAt > now);
      const expiredAccounts = accounts.filter((a) => a.expiresAt <= now);
      return {
        totalUsers: allUsers.filter((u) => u.role === "user").length,
        activeUsers: activeAccounts.length,
        expiredUsers: expiredAccounts.length,
        totalFiles: files.length,
        totalServers: accounts.reduce((s, a) => s + a.maxServers, 0),
      };
    }),

    // Get activity logs
    getLogs: adminProcedure.query(async () => {
      return getActivityLogs(200);
    }),

    // Get all files
    getAllFiles: adminProcedure.query(async () => {
      return getAllFileUploads();
    }),
  }),

  // ─── User ──────────────────────────────────────────────────────────────────
  user: router({
    getMyAccount: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user as any;
      const account = await getHostingAccountByUserId(user.id);
      const now = new Date();
      const daysLeft = account
        ? Math.max(0, Math.ceil((account.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        hosting: account
          ? {
              maxServers: account.maxServers,
              daysAllowed: account.daysAllowed,
              expiresAt: account.expiresAt,
              daysLeft,
              isExpired: account.expiresAt <= now,
            }
          : null,
      };
    }),

    getMyFiles: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user as any;
      return getFileUploadsByUserId(user.id);
    }),

    uploadFile: protectedProcedure
      .input(
        z.object({
          filename: z.string(),
          mimeType: z.string().optional(),
          fileSize: z.number().optional(),
          fileBase64: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = ctx.user as any;

        // Check account validity
        const account = await getHostingAccountByUserId(user.id);
        if (!account || account.expiresAt <= new Date()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "حسابك منتهي الصلاحية أو غير مفعّل" });
        }

        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.fileBase64, "base64");
        const suffix = nanoid(8);
        const fileKey = `uploads/${user.username}/${suffix}-${input.filename}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType || "application/octet-stream");

        // Save to DB
        await createFileUpload({
          userId: user.id,
          username: user.username,
          filename: `${suffix}-${input.filename}`,
          originalName: input.filename,
          fileUrl: url,
          fileKey,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          telegramSent: false,
        });

        // Get the inserted record
        const files = await getFileUploadsByUserId(user.id);
        const newFile = files[0];

        // Send to Telegram asynchronously
        if (newFile) {
          const caption = `📤 <b>ملف جديد</b>\n👤 المستخدم: <code>${user.username}</code>\n📄 الملف: <code>${input.filename}</code>\n💾 الحجم: ${input.fileSize ? (input.fileSize / 1024 / 1024).toFixed(2) + " MB" : "غير محدد"}`;
          sendTelegramDocument(url, caption, input.filename)
            .then(async (res) => {
              if (res.success && newFile.id) {
                await markTelegramSent(newFile.id, res.messageId || "");
              }
            })
            .catch(console.error);

          notifyFileUpload(user.username, input.filename, input.fileSize).catch(console.error);
        }

        await createActivityLog({
          userId: user.id,
          username: user.username,
          action: "upload_file",
          details: `رفع ملف: ${input.filename}`,
        });

        return { success: true, url, filename: `${suffix}-${input.filename}` };
      }),

    getMyLogs: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user as any;
      return getActivityLogsByUserId(user.id);
    }),
  }),

  // ─── Keep-Alive ────────────────────────────────────────────────────────────
  keepAlive: router({
    ping: publicProcedure.query(() => ({ ok: true, ts: Date.now() })),
  }),
});

export type AppRouter = typeof appRouter;
