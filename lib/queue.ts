import { Queue, ConnectionOptions } from "bullmq";

export const PUBLISH_QUEUE_NAME = "tiktok-publish-queue";
export const SCHEDULE_QUEUE_NAME = "tiktok-schedule-queue";

export interface PublishJobPayload {
  publishJobId: string;
  publishJobItemId: string;
  accountId: string;
  videoAssetId: string;
  caption: string;
  isRetry?: boolean;
}

export interface ScheduleJobPayload {
  publishJobId: string;
  scheduledFor: string; // ISO string
}

function parseRedisUrl(): ConnectionOptions {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "localhost",
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      password: parsed.password || undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return {
      host: "localhost",
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
}

export const redisConnectionOptions = parseRedisUrl();

// Global singletons for Next.js hot reload safety
const globalForQueues = globalThis as unknown as {
  publishQueue: Queue<PublishJobPayload> | undefined;
  scheduleQueue: Queue<ScheduleJobPayload> | undefined;
};

export const publishQueue =
  globalForQueues.publishQueue ??
  new Queue<PublishJobPayload>(PUBLISH_QUEUE_NAME, {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: {
        age: 24 * 3600, // keep 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // keep 7 days
      },
    },
  });

export const scheduleQueue =
  globalForQueues.scheduleQueue ??
  new Queue<ScheduleJobPayload>(SCHEDULE_QUEUE_NAME, {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 10000,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueues.publishQueue = publishQueue;
  globalForQueues.scheduleQueue = scheduleQueue;
}

/**
 * Enqueue a fan-out publish job item
 */
export async function enqueuePublishJobItem(data: PublishJobPayload) {
  const jobId = `job-${data.publishJobId}-item-${data.publishJobItemId}${data.isRetry ? `-retry-${Date.now()}` : ""}`;
  return await publishQueue.add("publish-video", data, {
    jobId,
  });
}

/**
 * Enqueue a delayed job for scheduled publishing
 */
export async function enqueueScheduledJob(data: ScheduleJobPayload, delayMs: number) {
  const jobId = `schedule-${data.publishJobId}`;
  return await scheduleQueue.add("execute-schedule", data, {
    jobId,
    delay: Math.max(0, delayMs),
  });
}
