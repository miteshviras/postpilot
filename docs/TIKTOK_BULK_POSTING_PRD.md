# TikTok Bulk Posting PRD

Source: https://app.notion.com/p/TikTok-Bulk-Posting-PRD-3fe831767b478198a39cd9276a0c6cbc

## Problem
Creators and social teams who manage multiple TikTok accounts must currently post the same video manually, one account at a time. This is slow, repetitive, and hard to scale.

## Goal
Build a web app that lets a user connect multiple TikTok accounts and bulk publish the same video and caption to selected accounts from one interface.

## Product direction
This product will be built as a **single Next.js 16 application** where the frontend and backend live in the same codebase. The system will run fully in **Docker**, including PostgreSQL and Redis, so the entire stack can be started and managed with Docker Compose.

## Success metrics
- User can connect multiple TikTok accounts through OAuth.
- User can upload one video and select one or more connected accounts.
- User can publish the same post to multiple accounts in a single workflow.
- Failed posts are visible with retry support.
- Users can schedule posts.

## Target users
- Solo creators with multiple TikTok accounts
- Agencies managing client accounts
- Social media teams repurposing the same content across brands

## Core user stories
1. As a user, I can connect several TikTok accounts.
2. As a user, I can upload one video once and publish it to multiple accounts.
3. As a user, I can enter one caption for all selected accounts or customize per account.
4. As a user, I can schedule posts for later.
5. As a user, I can see which account succeeded or failed.

## Functional requirements
- TikTok OAuth account connection
- Account list with display name and status
- Video upload
- Caption input
- Multi-account selection
- Bulk publish action
- Scheduling support
- Per-account job status tracking
- Retry for failed publishes
- Basic analytics for post history

## Non-functional requirements
- Secure token storage
- Background job processing for uploads and publishing
- Clear error handling and status feedback
- Scalable architecture for many connected accounts
- Dockerized local and deployment workflow

## Constraints and assumptions
- Posting must rely on official TikTok APIs and permitted scopes.
- Each TikTok account must be authorized individually.
- Publishing rights may vary by app review status and account permissions.
- The first release should focus on the simplest reliable bulk-publishing flow.
- PostgreSQL and Redis will be containerized and managed under Docker.
- Next.js 16 will be used for both frontend and backend.

## Out of scope for MVP
- Cross-platform publishing beyond TikTok
- Advanced analytics dashboards
- Team permissions and approvals
- AI caption generation
- Auto-editing videos

## Risks
- API permissions and review requirements may limit posting behavior.
- Token expiration and refresh logic can cause posting failures.
- Rate limits may affect large bulk jobs.
- TikTok policy changes may alter available posting features.

## Open questions
- Should the MVP support one shared caption only, or per-account captions from day one?
- Should scheduling be part of MVP or phase 2?
- Should drafts be saved before publishing?

---

# Tech Handoff

## Architecture
- **Frontend and backend**: Next.js 16 (App Router)
- **Runtime**: Node.js inside Docker
- **Database**: PostgreSQL in Docker (via Prisma ORM)
- **Queue**: Redis in Docker (via BullMQ)
- **Background processing**: worker process in Docker
- **Storage**: S3-compatible object storage for video assets (MinIO / AWS S3)

## Containerized stack
- `web`: Next.js app with UI + API routes / server actions
- `postgres`: persistent relational database
- `redis`: queue and job coordination
- `worker`: background job processor for uploads, publish jobs, retries, and scheduling
- optional `storage`: MinIO for local development

## Core entities
- `User`
- `TikTokAccount`
- `VideoAsset`
- `PublishJob`
- `PublishJobItem`
- `Schedule`

## API surface
- `POST /auth/tiktok/connect`
- `POST /videos`
- `POST /publish-jobs`
- `GET /publish-jobs/:id`
- `POST /publish-jobs/:id/retry`
- `GET /accounts`

## Workflow
1. User connects TikTok accounts through OAuth.
2. User uploads a video once.
3. User selects target accounts and adds caption.
4. Backend creates a publish job per account.
5. Workers call TikTok posting APIs and write per-account status.
6. UI refreshes job progress and failures.

## Key implementation notes
- Store tokens encrypted at rest.
- Refresh tokens before expiry when possible.
- Make publish jobs idempotent.
- Persist provider response payloads for debugging.
- Use retries with backoff for transient failures.
- Keep all infrastructure dependencies inside Docker Compose for local development.
- Use Next.js 16 app routes, server actions, and route handlers as the primary full-stack pattern.

## Acceptance criteria
- Connected accounts are listed and selectable.
- One video can be posted to multiple accounts from one action.
- Failed publishes are clearly surfaced with retry capability.
- Scheduled jobs execute at the expected time window.
- PostgreSQL and Redis run successfully in Docker.
- The app starts with one compose command.

---

# Design

## Primary screens

### 1. Accounts dashboard
- Connected TikTok accounts list
- Connection status badges (Active, Expired, Revoked)
- Add account CTA
- Last sync / last publish info

### 2. Bulk publish composer
- Video upload area (drag & drop, file validation)
- Caption field (with emoji & character counter, customizable per account toggle)
- Account multi-select checklist (quick select all / deselect all)
- Schedule toggle and date/time picker
- Publish button

### 3. Job progress screen
- Overall progress bar
- Per-account status cards
- Success / failed / retry states
- Error details expandable section

### 4. History and analytics
- Recent posts table
- Filters by account and status
- Basic delivery metrics

## Interaction principles
- One primary action per screen.
- Keep the bulk publish flow to 3 steps or fewer.
- Show partial success instead of failing the whole batch.
- Make retry obvious for failed account posts.

## Visual direction
- Clean creator-tool dashboard
- Dense enough for power users, but simple for first-time use
- Emphasis on progress states, status chips, and clear hierarchy

## Empty states
- No connected accounts: prompt to connect the first account.
- No uploads yet: show a drag-and-drop upload area.
- No job history: show a sample workflow illustration and CTA.

---

# Docker and environment expectations

## Compose services
- `web`
- `worker`
- `postgres`
- `redis`
- optional `minio`

## Environment variables
- `DATABASE_URL`
- `REDIS_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `TIKTOK_CLIENT_ID`
- `TIKTOK_CLIENT_SECRET`
- `MINIO_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `AWS_BUCKET`

## Delivery order
1. Docker foundation
2. Next.js 16 app shell
3. PostgreSQL + Prisma
4. Authentication
5. TikTok account connection
6. Upload and storage
7. Queue + worker pipeline
8. Bulk publishing
9. Scheduling and retries
10. Analytics and polish

---

# Phase-by-Phase AI Delivery Plan

## Working model
This project will be executed in small phases so any AI coding tool can work step by step without skipping validation.

## Rules for every phase
- Read the current phase before making changes.
- Read the completed prior phase(s) before continuing.
- Do not skip tasks.
- Do not change completed phase scope unless the plan is updated first.
- Do not modify database schema without a migration.
- Do not ignore failing tests.
- Do not leave TODOs in finished code.
- Update documentation when behavior changes.
- Commit after each completed task.
- Push after each successful phase.

## Required loop for every task
1. Implement the task.
2. Run lint, typecheck, and tests.
3. Fix failures.
4. Run the checks again.
5. Repeat until clean.
6. Commit the change.
7. Push the branch.
8. Mark the task done.

## Definition of done for a phase
A phase is complete only when all of the following are true:
- Feature is implemented.
- TypeScript passes.
- Lint passes.
- Tests pass.
- Docker services are healthy.
- Documentation is updated.
- Commit is created.
- Changes are pushed.

## Suggested phase structure
- **Phase 01 — Foundation**: Docker, Next.js 16, TypeScript, linting, formatting, app shell, PostgreSQL, Redis.
- **Phase 02 — Auth and accounts**: Authentication, TikTok OAuth connection, account storage, account listing UI.
- **Phase 03 — Upload and storage**: Video upload flow, object storage, file validation, asset records.
- **Phase 04 — Queue and worker pipeline**: Redis queue, worker process, job status model, retries, idempotency.
- **Phase 05 — Bulk publishing**: Single upload to many accounts, caption handling, job fan-out, progress UI.
- **Phase 06 — Scheduling**: Deferred publishing, scheduled job execution, timezone handling.
- **Phase 07 — Testing and reliability**: Unit tests, integration tests, failure scenarios, retry loops, observability.
- **Phase 08 — Polishing and release**: UX cleanup, docs, release checklist, final hardening, branch cleanup.
