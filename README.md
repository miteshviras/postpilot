# 🚀 PostPilot — TikTok Multi-Account Bulk Posting Platform

> **Upload Once. Publish to All Your TikTok Accounts Simultaneously.**  
> A production-ready full-stack system built with **Next.js 16**, **Docker Compose**, **PostgreSQL**, **Redis**, and **BullMQ** background workers.

---

## 💡 The "Why": Problem Statement & Motivation

### 🛑 The Problem: The Creator & Agency Friction
Solo creators, marketing agencies, media networks, and multi-brand operators face a severe bottleneck when distributing short-form video content on TikTok:
1. **Repetitive Manual Uploads**: To post a single viral video across 5, 10, or 20 brand accounts or creator personas, managers must manually log into each account, switch profiles, re-upload the same video file, and re-type captions and hashtags one by one.
2. **High Operational Drag**: What should take 30 seconds takes 45–60 minutes per day, introducing human error, typos, inconsistent hashtags, and scheduling delays.
3. **Fragile Dispatch & Zero Error Isolation**: If an upload fails midway on account #4 due to a transient network timeout or rate limit, managers have no unified visibility into what succeeded, what failed, or how to re-dispatch only the failed post without duplicate uploads.
4. **Token Expiry & Security Vulnerabilities**: Storing TikTok credentials or tokens insecurely poses major security risks. Manual logins require frequent 2FA re-auths and password sharing across team members.

---

### ✨ The Solution: What PostPilot Solves
PostPilot delivers an enterprise-grade, unified publishing control center designed specifically for TikTok multi-account workflows:
- **One-Click Multi-Account Authorization**: Connect unlimited TikTok creator profiles via official OAuth 2.0. Tokens are encrypted at rest with AES-256-GCM and automatically refreshed before expiration.
- **Single-Upload Fan-Out**: Upload a high-definition video asset once. PostPilot stores and optimizes the file, then dispatches asynchronous background publishing tasks to all selected accounts simultaneously.
- **Granular Customization**: Keep a unified hook and caption across all accounts, or toggle brand-specific custom captions per profile with hashtag presets.
- **Non-Blocking Background Worker Pipeline**: Backed by Redis and BullMQ, heavy video processing, TikTok Direct Post API chunked uploads, and polling occur in isolated background worker processes.
- **Fault-Tolerant Partial Success & One-Click Retry**: If 9 accounts succeed and 1 encounters a rate limit, the 9 succeed cleanly. The failed account is isolated on the Job Monitor with full provider diagnostics and a one-click Retry button powered by exponential backoff.
- **Built-in Developer Simulator**: Test and demo the entire multi-account upload, queue, progress ring, and status pipeline locally without needing pending TikTok developer approvals.

---

## 🏗️ System Architecture & Workflow

```mermaid
flowchart TD
    subgraph UI["Next.js 16 Client (App Router)"]
        Dashboard["/accounts (Accounts Dashboard)"]
        Composer["/composer (Bulk Composer)"]
        Monitor["/jobs/[id] (Job Progress Monitor)"]
        History["/history (Audit Trail & Analytics)"]
    end

    subgraph Server["Next.js 16 Server Handlers"]
        AuthAPI["/api/auth/tiktok/* (OAuth 2.0)"]
        VideoAPI["/api/videos (Upload & Validation)"]
        PublishAPI["/api/publish-jobs (Fan-Out Dispatcher)"]
        RetryAPI["/api/publish-jobs/[id]/retry (Retry Handler)"]
    end

    subgraph DataQueue["Persistent Storage & Queuing"]
        Postgres[("PostgreSQL 16 DB (Prisma 7)")]
        Redis[("Redis 7 (BullMQ Queues)")]
        LocalS3[("Video Storage (Local / MinIO / S3)")]
    end

    subgraph WorkerService["Background Worker Service"]
        Worker["BullMQ Worker Process"]
        TikTokClient["TikTok Direct Post API Client"]
    end

    subgraph TikTokCloud["TikTok Platform"]
        TikTokAuth["TikTok Login Kit (OAuth 2.0)"]
        TikTokAPI["TikTok Content Posting API v2"]
    end

    Composer -->|1. Upload Video| VideoAPI
    VideoAPI -->|Store file| LocalS3
    Composer -->|2. Create Bulk Post| PublishAPI
    PublishAPI -->|Fan-out child jobs| Redis
    PublishAPI -->|Persist state| Postgres

    Redis --> Worker
    Worker -->|Load Video| LocalS3
    Worker -->|Direct Post| TikTokAPI
    Worker -->|Update Status| Postgres

    Monitor -.->|Real-time Poll| PublishAPI
    Dashboard -->|Connect Profile| AuthAPI
    AuthAPI -->|Exchange Code| TikTokAuth
    RetryAPI -->|Re-enqueue Failed| Redis
```

---

## 🖥️ Primary Screens & Capabilities

| Screen | Route | Key Features |
| :--- | :--- | :--- |
| **Overview Dashboard** | `/` | System health indicators, architecture checklist, workflow pillars, and quick navigation. |
| **Connected Accounts** | `/accounts` | Authorized TikTok profiles, follower counts, status chips (`ACTIVE`, `EXPIRED`, `REVOKED`), account disconnect, and "+ Connect Demo Account" simulator. |
| **Bulk Composer** | `/composer` | Video drag-and-drop uploader with HTML5 player preview, caption editor with hashtag presets, multi-account checklist (Select All/None), custom captions per account toggle, and schedule picker. |
| **Job Progress Monitor** | `/jobs/[id]` | Real-time circular SVG progress ring, per-account status chips (`PENDING`, `UPLOADING`, `PROCESSING`, `PUBLISHED`, `FAILED`), expandable TikTok error drawer, and one-click "Retry Failed Accounts". |
| **Job Listing** | `/jobs` | High-level summary of all past and active bulk publish workflows. |
| **History & Analytics** | `/history` | Filterable and searchable audit trail of past dispatches, delivery success rate, and platform metrics. |

---

## 📚 Documentation Guide

All system specifications, design blueprints, and execution plans are preserved in the [`docs/`](./docs) directory:

| Document | Purpose |
| :--- | :--- |
| [**`docs/TIKTOK_BULK_POSTING_PRD.md`**](./docs/TIKTOK_BULK_POSTING_PRD.md) | **Original Notion PRD**: The source blueprint retrieved directly from Notion, containing problem definitions, success metrics, user stories, API surfaces, and constraints. |
| [**`docs/ARCHITECTURE.md`**](./docs/ARCHITECTURE.md) | **Technical Architecture & Specifications**: Detailed topology diagrams, database entity models, Docker services, TikTok Direct Post API chunked protocols, and security practices. |
| [**`docs/PHASE_PLAN.md`**](./docs/PHASE_PLAN.md) | **Delivery Tracker**: Phase-by-phase execution tracker (Phase 01 through Phase 08) with all tasks, acceptance criteria, and completion records. |

---

## ⚡ Setup & Installation Guide

You can run PostPilot either fully containerized via **Docker Compose** (recommended for production and complete parity) or via **Local Development** on your workstation.

### Option 1: Docker Compose (One-Command Setup)

The stack is containerized with 5 orchestrated services (`web`, `worker`, `postgres`, `redis`, `minio`):

```bash
# 1. Clone the repository
git clone https://github.com/miteshviras/postpilot.git
cd postpilot

# 2. Copy the environment configuration
cp .env.example .env

# 3. Build and launch all services in background
docker compose up --build -d
```

#### Verifying Docker Containers
```bash
docker compose ps
```

Expected running services:
- **`postpilot-web`**: Next.js 16 Web Application ([http://localhost:3000](http://localhost:3000))
- **`postpilot-worker`**: BullMQ Background Worker process
- **`postpilot-postgres`**: PostgreSQL 16 database (port `5432`)
- **`postpilot-redis`**: Redis 7 queue store (port `6379`)
- **`postpilot-minio`**: MinIO S3 Object Storage Console ([http://localhost:9001](http://localhost:9001))

#### Stopping the Stack
```bash
docker compose down
```

---

### Option 2: Local Development Setup

If you prefer to run Next.js and the background worker natively on your workstation:

#### 1. Prerequisites
- **Node.js**: v20+ or v22+ (tested on Node 22 and Node 26)
- **PostgreSQL**: Local service on port 5432 or running via Docker:
  ```bash
  docker run --name postpilot-postgres -e POSTGRES_USER=postpilot -e POSTGRES_PASSWORD=postpilot_secret -e POSTGRES_DB=postpilot -p 5432:5432 -d postgres:16-alpine
  ```
- **Redis**: Local service on port 6379 or running via Docker:
  ```bash
  docker run --name postpilot-redis -p 6379:6379 -d redis:7-alpine
  ```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Environment Variables
```bash
cp .env.example .env
```
Edit `.env` to verify your database and Redis connection strings:
```env
DATABASE_URL="postgresql://postpilot:postpilot_secret@localhost:5432/postpilot?schema=public"
REDIS_URL="redis://localhost:6379"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

#### 4. Initialize Database & Seed Demo Data
```bash
# Generate the Prisma 7 client
npm run db:generate

# (Optional) Seed demo user and sample TikTok accounts
npm run seed
```

#### 5. Start the Application
Open two terminal windows:

**Terminal 1 — Next.js Web App**:
```bash
npm run dev
```

**Terminal 2 — Background Worker**:
```bash
npm run worker
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Quality Assurance

PostPilot maintains a strict automated test suite and zero-warning linting standards:

```bash
# Run unit & integration tests (built-in Node test runner via tsx)
npm test

# Run ESLint (0 errors, 0 warnings standard)
npm run lint

# Run TypeScript type check
npx tsc --noEmit

# Run Next.js 16 production Turbopack build
npm run build
```

### Unit Test Suite Details (`tests/`)
- `tests/crypto.test.ts`: Validates AES-256-GCM token encryption, random IV initialization, and tampering rejection.
- `tests/tiktok.test.ts`: Validates OAuth URL generation, state validation, simulator token exchange, and direct post initialization.
- `tests/storage.test.ts`: Validates video buffer saving, mime-type verification, and cleanup.

---

## 🔐 Environment Variables Reference

| Variable | Description | Default (Local) |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string with schema | `postgresql://postpilot:postpilot_secret@localhost:5432/postpilot?schema=public` |
| `REDIS_URL` | Redis instance URL for BullMQ queues | `redis://localhost:6379` |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM token encryption | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |
| `NEXTAUTH_SECRET` | Session signing secret | `super_secret_postpilot_jwt_signing_key_32bytes` |
| `NEXTAUTH_URL` | Application root URL | `http://localhost:3000` |
| `TIKTOK_CLIENT_ID` | TikTok Developer App Key (Login Kit & Content Posting API) | `mock_tiktok_client_key` |
| `TIKTOK_CLIENT_SECRET` | TikTok Developer App Secret | `mock_tiktok_client_secret` |
| `TIKTOK_REDIRECT_URI` | Authorized OAuth redirect URL | `http://localhost:3000/api/auth/tiktok/callback` |
| `STORAGE_PROVIDER` | Video storage provider (`local` or `s3`) | `local` |
| `UPLOAD_DIR` | Filesystem directory for uploaded video assets | `./public/uploads` |
| `MINIO_ENDPOINT` | Local S3-compatible MinIO endpoint | `localhost` |
| `MINIO_PORT` | MinIO API port | `9000` |

---

## 🎨 Modern Web Guidance Compliance

- **`brand-consistent-forms`**: Native form controls (`<input type="checkbox">`, `<progress>`, `<input type="range">`) utilize `accent-color: var(--brand-color)` combined with `color-scheme: dark` to match TikTok branding.
- **Progressive Enhancement**: `@supports not (accent-color: ...)` rules provide custom styled fallbacks for browsers lacking native accent-color support.
- **Accessibility & Focus**: All interactive controls feature high-contrast visible focus rings (`focus-visible`) and accessible `<label>` pairings.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
