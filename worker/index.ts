import { Worker, Job } from "bullmq";
import {
  PUBLISH_QUEUE_NAME,
  SCHEDULE_QUEUE_NAME,
  PublishJobPayload,
  ScheduleJobPayload,
  redisConnectionOptions,
  enqueuePublishJobItem,
} from "../lib/queue";
import { prisma } from "../lib/db";
import { decryptToken, encryptToken } from "../lib/crypto";
import { getVideoBuffer } from "../lib/storage";
import {
  refreshTikTokAccessToken,
  initTikTokVideoPost,
  uploadVideoToTikTokUrl,
  checkTikTokPublishStatus,
} from "../lib/tiktok";
import { Prisma } from "@prisma/client";

console.log("🚀 Starting PostPilot Background Worker...");

/**
 * Worker for executing video publishing to TikTok
 */
export const publishWorker = new Worker<PublishJobPayload>(
  PUBLISH_QUEUE_NAME,
  async (job: Job<PublishJobPayload>) => {
    const { publishJobId, publishJobItemId, accountId, caption } = job.data;
    console.log(`[Job ${job.id}] Processing publish item: ${publishJobItemId} for account: ${accountId}`);

    try {
      // 1. Fetch Job Item and TikTok Account
      const item = await prisma.publishJobItem.findUnique({
        where: { id: publishJobItemId },
        include: {
          account: true,
          publishJob: {
            include: { videoAsset: true },
          },
        },
      });

      if (!item) {
        throw new Error(`PublishJobItem ${publishJobItemId} not found`);
      }

      // Update item to UPLOADING and increment attempt count
      await prisma.publishJobItem.update({
        where: { id: publishJobItemId },
        data: {
          status: "UPLOADING",
          attemptCount: { increment: 1 },
          errorMessage: null,
        },
      });

      // 2. Token Refresh Check
      let accessToken = decryptToken(item.account.encryptedAccessToken);
      const isExpiringSoon = item.account.tokenExpiresAt.getTime() - Date.now() < 10 * 60 * 1000;

      if (isExpiringSoon) {
        console.log(`[Job ${job.id}] Access token expiring soon, refreshing...`);
        try {
          const refreshToken = decryptToken(item.account.encryptedRefreshToken);
          const newTokens = await refreshTikTokAccessToken(refreshToken);
          accessToken = newTokens.accessToken;

          await prisma.tikTokAccount.update({
            where: { id: item.account.id },
            data: {
              encryptedAccessToken: encryptToken(newTokens.accessToken),
              encryptedRefreshToken: encryptToken(newTokens.refreshToken),
              tokenExpiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
            },
          });
        } catch (refreshErr: unknown) {
          const errMsg = refreshErr instanceof Error ? refreshErr.message : "Unknown token refresh error";
          console.warn(`[Job ${job.id}] Token refresh warning: ${errMsg}`);
        }
      }

      // 3. Load video buffer
      const videoBuffer = await getVideoBuffer(item.publishJob.videoAsset.storageKey);

      // 4. Initialize Post with TikTok
      const initResult = await initTikTokVideoPost(accessToken, caption, videoBuffer.length);
      console.log(`[Job ${job.id}] TikTok initialized publishId: ${initResult.publishId}`);

      await prisma.publishJobItem.update({
        where: { id: publishJobItemId },
        data: {
          status: "PROCESSING",
          tiktokPublishId: initResult.publishId,
        },
      });

      // 5. Upload Video Chunk
      await uploadVideoToTikTokUrl(initResult.uploadUrl, videoBuffer);
      console.log(`[Job ${job.id}] Upload completed to TikTok URL`);

      // 6. Verify Status
      const statusResult = await checkTikTokPublishStatus(accessToken, initResult.publishId);

      if (statusResult.status === "FAILED") {
        throw new Error(statusResult.failReason || "TikTok reported posting failure");
      }

      // 7. Mark Item as Published
      await prisma.publishJobItem.update({
        where: { id: publishJobItemId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          tiktokShareId: statusResult.shareId || `share_${initResult.publishId}`,
          responsePayload: statusResult as unknown as Prisma.InputJsonValue,
        },
      });

      await prisma.tikTokAccount.update({
        where: { id: accountId },
        data: { lastPublishAt: new Date() },
      });

      // Update parent Job counts
      await updateParentJobStatus(publishJobId);
      console.log(`✅ [Job ${job.id}] Published successfully to account: ${item.account.displayName}`);
      return { success: true, publishId: initResult.publishId };
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Unknown error during TikTok publishing";
      console.error(`❌ [Job ${job.id}] Failed publish item ${publishJobItemId}:`, errMessage);

      await prisma.publishJobItem.update({
        where: { id: publishJobItemId },
        data: {
          status: "FAILED",
          errorMessage: errMessage,
        },
      });

      await updateParentJobStatus(publishJobId);
      throw err;
    }
  },
  {
    connection: redisConnectionOptions,
    concurrency: 5,
  }
);

/**
 * Worker for handling delayed scheduled publish triggers
 */
export const scheduleWorker = new Worker<ScheduleJobPayload>(
  SCHEDULE_QUEUE_NAME,
  async (job: Job<ScheduleJobPayload>) => {
    const { publishJobId } = job.data;
    console.log(`⏰ [Schedule ${job.id}] Triggering scheduled publish for job: ${publishJobId}`);

    const publishJob = await prisma.publishJob.findUnique({
      where: { id: publishJobId },
      include: {
        items: true,
        schedule: true,
      },
    });

    if (!publishJob) {
      throw new Error(`Scheduled PublishJob ${publishJobId} not found`);
    }

    if (publishJob.schedule) {
      await prisma.schedule.update({
        where: { id: publishJob.schedule.id },
        data: { status: "EXECUTED" },
      });
    }

    await prisma.publishJob.update({
      where: { id: publishJobId },
      data: { status: "IN_PROGRESS" },
    });

    // Enqueue all items
    for (const item of publishJob.items) {
      await enqueuePublishJobItem({
        publishJobId: publishJob.id,
        publishJobItemId: item.id,
        accountId: item.accountId,
        videoAssetId: publishJob.videoAssetId,
        caption: item.customCaption || publishJob.defaultCaption,
      });
    }

    console.log(`✅ [Schedule ${job.id}] Enqueued ${publishJob.items.length} items for execution.`);
    return { dispatchedItems: publishJob.items.length };
  },
  {
    connection: redisConnectionOptions,
    concurrency: 2,
  }
);

/**
 * Evaluates parent job overall status (COMPLETED, PARTIAL_SUCCESS, FAILED)
 */
async function updateParentJobStatus(publishJobId: string) {
  const items = await prisma.publishJobItem.findMany({
    where: { publishJobId },
  });

  const total = items.length;
  const published = items.filter((i) => i.status === "PUBLISHED").length;
  const failed = items.filter((i) => i.status === "FAILED").length;
  const completedOrFailed = published + failed;

  let overallStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PARTIAL_SUCCESS" | "FAILED" = "IN_PROGRESS";

  if (completedOrFailed === total) {
    if (published === total) {
      overallStatus = "COMPLETED";
    } else if (failed === total) {
      overallStatus = "FAILED";
    } else {
      overallStatus = "PARTIAL_SUCCESS";
    }
  }

  await prisma.publishJob.update({
    where: { id: publishJobId },
    data: {
      status: overallStatus,
      successCount: published,
      failedCount: failed,
    },
  });
}

publishWorker.on("ready", () => console.log("✨ Publish worker connected and waiting for jobs"));
publishWorker.on("error", (err) => console.error("Publish worker error:", err));
scheduleWorker.on("ready", () => console.log("✨ Schedule worker connected and waiting for jobs"));
scheduleWorker.on("error", (err) => console.error("Schedule worker error:", err));
