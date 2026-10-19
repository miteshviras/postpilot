# TikTok Bulk Posting AI Delivery Phase Plan

Following the delivery rules outlined in the PRD, this document tracks the step-by-step progress through all phases.

---

## Phase 01 — Foundation & Docker Stack
- [ ] **Task 1.1: Docker & Compose Setup**
  - Create `docker-compose.yml` with `web`, `worker`, `postgres`, `redis`, and optional `minio`.
  - Create `Dockerfile` optimized for multi-stage Next.js 16 build and background worker.
  - Create `.env.example` with all required environment variables.
- [ ] **Task 1.2: Database & Prisma Configuration**
  - Install Prisma ORM and `@prisma/client`.
  - Define schema (`User`, `TikTokAccount`, `VideoAsset`, `PublishJob`, `PublishJobItem`, `Schedule`).
  - Configure initial migration and database seed for local testing.
- [ ] **Task 1.3: Application Shell & Navigation**
  - Implement modern creator-tool responsive layout with sidebar navigation:
    - `/` (Redirect or Overview)
    - `/accounts` (Connected Accounts)
    - `/composer` (Bulk Publish Composer)
    - `/jobs` or `/jobs/[id]` (Job Progress & Monitoring)
    - `/history` (Post History & Analytics)
  - Configure brand-consistent form styling (`accent-color`, Tailwind CSS v4 variables).
- [ ] **Task 1.4: Validation & Git Commit**
  - Verify `npm run lint` and `npx tsc --noEmit`.
  - Commit Phase 01 foundation changes.

---

## Phase 02 — Auth & TikTok Account Connection
- [ ] **Task 2.1: TikTok OAuth 2.0 Integration & Token Encryption**
  - Implement AES-256-GCM encryption utility for secure token storage at rest.
  - Implement `/api/auth/tiktok/connect` redirect handler with PKCE & state validation.
  - Implement `/api/auth/tiktok/callback` OAuth code exchange and user info fetching.
  - Implement token refresh helper before expiry.
- [ ] **Task 2.2: Connected Accounts Dashboard UI**
  - Build `/accounts` page showing account list, avatar, handle, follower count, status badges (`ACTIVE`, `EXPIRED`, `REVOKED`), disconnect action, and "Connect Account" CTA.
  - Handle empty states and mock mode for development without live TikTok API keys.
- [ ] **Task 2.3: Validation & Git Commit**
  - Run lint & typecheck.
  - Commit Phase 02.

---

## Phase 03 — Upload & Storage Pipeline
- [ ] **Task 3.1: Video Upload & Storage Adapter**
  - Implement Storage abstraction supporting local disk storage & S3/MinIO compatible storage.
  - Implement `/api/videos` route handler for drag-and-drop video upload with chunk/size validation (mp4, webm, mov, max 4GB).
- [ ] **Task 3.2: Asset Record & Video Preview UI**
  - Store video metadata in `VideoAsset` model.
  - Add video player preview and metadata display in composer.
- [ ] **Task 3.3: Validation & Git Commit**
  - Run lint & typecheck.
  - Commit Phase 03.

---

## Phase 04 — Queue & Worker Pipeline
- [ ] **Task 4.1: Redis & BullMQ Queue Integration**
  - Configure BullMQ connection and queue definitions (`publish-queue`, `scheduled-queue`).
  - Implement worker entry point (`worker/index.ts`) for asynchronous job consumption.
- [ ] **Task 4.2: Idempotent Job Execution & Status Tracking**
  - Ensure publish jobs are idempotent with deduplication keys.
  - Exponential backoff retry policy for transient errors (rate limit, network blip).
- [ ] **Task 4.3: Validation & Git Commit**
  - Run lint & typecheck.
  - Commit Phase 04.

---

## Phase 05 — Bulk Publishing Flow
- [ ] **Task 5.1: Bulk Publish Composer UI**
  - Interactive multi-account checklist (Select All, Deselect All, Account Badges).
  - Caption editor with character counter, hashtag suggestions, and toggle for "Custom caption per account".
  - One-click "Publish Now" fan-out trigger.
- [ ] **Task 5.2: Fan-out Dispatcher & Progress UI**
  - `/api/publish-jobs` fan-out endpoint creating child `PublishJobItem` per target account.
  - Real-time job progress monitor at `/jobs/[id]` displaying percentage progress ring, per-account status chips, error logs, and one-click Retry button for failed accounts.
- [ ] **Task 5.3: Validation & Git Commit**
  - Run lint & typecheck.
  - Commit Phase 05.

---

## Phase 06 — Scheduling & Timezones
- [ ] **Task 6.1: Schedule Picker & Delayed Job Queue**
  - Date & time picker with timezone support in the Composer.
  - Enqueue delayed jobs into BullMQ with timestamp calculation.
- [ ] **Task 6.2: Scheduled Posts Management**
  - Scheduled queue view with ability to edit time or cancel scheduled posts before execution.
- [ ] **Task 6.3: Validation & Git Commit**
  - Run lint & typecheck.
  - Commit Phase 06.

---

## Phase 07 — History, Analytics & Polish
- [ ] **Task 7.1: History Table & Delivery Metrics**
  - Table of past publishes with account filters, date range, success/failure counts.
  - Detail modal to view TikTok share link and response payloads.
- [ ] **Task 7.2: Modern Web Guidance Compliance & UI Polish**
  - Modern HTML semantics, accessible focus rings, keyboard navigability, and `accent-color` theming.
  - Full end-to-end smoke tests and health checks.
- [ ] **Task 7.3: Final Commit & Release Summary**
