// OAuth replaced by custom username/password auth
import type { Express } from "express";

export function registerOAuthRoutes(_app: Express) {
  // No OAuth routes - using custom auth via /api/auth/login
}
