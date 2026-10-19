# System Architecture & Technical Specifications

## 1. System Overview

PostPilot is a full-stack Next.js 16 application engineered for multi-account TikTok bulk video publishing, scheduling, background transcoding/upload, and per-account dispatch tracking.

```mermaid
flowchart TD
    subgraph Client["Browser (Next.js 16 UI)"]
        UI_Dash["Accounts Dashboard (/accounts)"]
        UI_Compose["Bulk Composer (/composer)"]
        UI_Progress["Job Progress (/jobs/[id])"]
        UI_History["History & Analytics (/history)"]
    end

    subgraph AppServer["Next.js 16 Server (App Router)"]
        API_Auth["/api/auth/tiktok/* (OAuth 2.0)"]
        API_Videos["/api/videos (Upload handler)"]
        API_Jobs["/api/publish-jobs (Fan-out dispatcher)"]
        API_Accounts["/api/accounts (Sync & Manage)"]
        PrismaClient["Prisma ORM"]
    end

    subgraph StorageQueue["Storage & Queuing"]
        MinIO["MinIO / AWS S3 (Video Assets)"]
        Redis["Redis (BullMQ queues & locks)"]
    end

    subgraph BackgroundWorker["Background Worker Service"]
        JobProcessor["Publish Job Processor"]
        ScheduleCron["Scheduler & Cron Poller"]
        TikTokClient["TikTok Direct Post API Client"]
    end

    subgraph Database["PostgreSQL 16"]
        PG[(Postgres Relational DB)]
    end

    subgraph TikTokCloud["TikTok Developer Platform"]
        TTOAuth["TikTok Login Kit (OAuth v2)"]
        TTApi["TikTok Content Posting API (Direct Post)"]
    end

    UI_Compose -->|1. Upload Video| API_Videos
    API_Videos -->|Store raw video| MinIO
    UI_Compose -->|2. Create Bulk Post Job| API_Jobs
    API_Jobs -->|Fan-out jobs| Redis
    API_Jobs -->|Persist state| PrismaClient
    PrismaClient --> PG

    Redis --> JobProcessor
    JobProcessor -->|Fetch Video Asset| MinIO
    JobProcessor -->|Initiate Direct Post| TTApi
    JobProcessor -->|Update Job Item Status| PrismaClient

    ScheduleCron -->|Trigger scheduled jobs| Redis

    UI_Auth["Connect Account"] --> API_Auth
    API_Auth -->|Exchange Code| TTOAuth
    API_Auth -->|Store encrypted tokens| PrismaClient
```

## 2. Docker Topology (`docker-compose.yml`)

The stack is orchestrated using Docker Compose with 4 core services:

1. **`web`**: Next.js 16 App Router application running on Node 20 / 22 Alpine, serving server actions, route handlers, and SSR UI components.
2. **`worker`**: Background worker process running BullMQ queues for handling asynchronous video uploads, TikTok Direct Post API chunked uploads, status polling, and retries with exponential backoff.
3. **`postgres`**: PostgreSQL 16 Alpine container with a persistent volume (`postgres_data`).
4. **`redis`**: Redis 7 Alpine container for BullMQ job queue management and distributed locking (`redis_data`).
5. **`minio`** (optional / local dev): Local S3-compatible object storage for storing uploaded video files before dispatching to TikTok.

## 3. Database Schema (Prisma)

### Key Models:
- **`User`**: Account owner/operator in PostPilot.
- **`TikTokAccount`**: Connected TikTok accounts storing open ID, union ID, display name, avatar URL, encrypted access token, encrypted refresh token, token expiry, scopes, and connection status (`ACTIVE`, `EXPIRED`, `REVOKED`).
- **`VideoAsset`**: Uploaded video files, containing S3/MinIO key, original file name, mime type, size, duration, width, height, and processing status.
- **`PublishJob`**: Top-level batch job representing a single user intent (e.g. 1 video + caption dispatched to $N$ accounts), with status (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `PARTIAL_SUCCESS`, `FAILED`), scheduled time, and summary counters.
- **`PublishJobItem`**: Per-account child job representing the discrete TikTok posting task, containing target account ID, customized or shared caption, TikTok publish ID / share ID, current status (`PENDING`, `UPLOADING`, `PROCESSING`, `PUBLISHED`, `FAILED`), attempt count, error messages, and raw API provider response payload.
- **`Schedule`**: Recurring or scheduled trigger definitions with cron/timestamp and timezone handling.

## 4. TikTok Content Posting API Flow

According to official TikTok Content Posting API guidelines:
1. **Scope required**: `video.publish`, `video.upload`.
2. **Direct Post flow**:
   - `POST /v2/post/publish/video/init/`: Initialize video upload, requesting upload URL and publish ID.
   - Upload chunked video bytes to TikTok's upload URL.
   - Poll `POST /v2/post/publish/status/fetch/` with `publish_id` until status is `SUCCESS` or `FAILED`.
3. **Token Management**:
   - Access tokens expire in 24 hours.
   - Refresh tokens expire in 365 days.
   - Worker automatically checks expiry and calls `/v2/oauth/token/` refresh before dispatching publish jobs.
