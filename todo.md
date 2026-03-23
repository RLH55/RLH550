# OMAR HOST - Project TODO

## Phase 1: Database Schema & Setup
- [x] Custom users table with username/password (no OAuth)
- [x] Hosting accounts table (days, servers, expiry)
- [x] Files upload table (user, filename, url, telegram status)
- [x] Activity logs table

## Phase 2: Backend - Auth, Users, Telegram
- [x] Custom JWT auth (username/password login)
- [x] Admin account seeding (OMAR_ADMIN / OMAR_2026_BRO)
- [x] Admin procedures: create/edit/delete users, set days & servers
- [x] User procedures: get account info, upload files
- [x] Telegram bot integration (send files + notifications)
- [x] File upload to S3 + forward to Telegram

## Phase 3: Frontend - Login & Admin Dashboard (Neon-Noir)
- [x] Login page with neon-noir design
- [x] Admin dashboard layout with sidebar
- [x] Admin: user management (create, edit, delete, extend)
- [x] Admin: system statistics panel
- [x] Admin: activity logs viewer

## Phase 4: User Dashboard & File Upload
- [x] User dashboard with account info (days left, servers)
- [x] File upload interface with progress
- [x] Auto-send to Telegram on upload
- [x] Upload history list

## Phase 5: Keep-Alive & Notifications
- [x] Keep-Alive ping endpoint
- [x] Client-side keep-alive mechanism
- [x] Auto Telegram notification on new user creation
- [x] Auto Telegram notification on file upload
- [x] Auto Telegram notification on account expiry

## Phase 6: Tests & Delivery
- [x] Vitest tests for auth procedures
- [x] Vitest tests for user management
- [x] Final checkpoint
