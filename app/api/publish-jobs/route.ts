import { NextRequest, NextResponse, connection } from "next/server";
import { prisma } from "@/lib/db";
import { enqueuePublishJobItem, enqueueScheduledJob } from "@/lib/queue";
import { getDefaultUser } from "@/lib/user";

// GET: List recent publish jobs
export async function GET() {
  await connection();
  try {
    const user = await getDefaultUser();

    const jobs = await prisma.publishJob.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        videoAsset: {
          select: {
            id: true,
            originalName: true,
            storageKey: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
        items: {
          include: {
            account: {
              select: {
                id: true,
                displayName: true,
                handle: true,
                avatarUrl: true,
              },
            },
          },
        },
        schedule: true,
      },
      take: 50,
    });

    const serializedJobs = jobs.map((job) => ({
      ...job,
      videoAsset: {
        ...job.videoAsset,
        sizeBytes: Number(job.videoAsset.sizeBytes),
        publicUrl: `/uploads/${job.videoAsset.storageKey}`,
      },
    }));

    return NextResponse.json({
      success: true,
      jobs: serializedJobs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to list publish jobs";
    console.error("Failed to list publish jobs:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST: Create a new bulk publish job (fan-out)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoAssetId, accountIds, defaultCaption, customCaptions, scheduledFor } = body;

    if (!videoAssetId) {
      return NextResponse.json(
        { success: false, error: "videoAssetId is required" },
        { status: 400 }
      );
    }

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one target account must be selected" },
        { status: 400 }
      );
    }

    if (!defaultCaption || defaultCaption.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Caption cannot be empty" },
        { status: 400 }
      );
    }

    const user = await getDefaultUser();

    // 1. Verify Video Asset
    const videoAsset = await prisma.videoAsset.findUnique({
      where: { id: videoAssetId },
    });

    if (!videoAsset) {
      return NextResponse.json(
        { success: false, error: "Video asset not found" },
        { status: 404 }
      );
    }

    // 2. Create Parent Publish Job
    const publishJob = await prisma.publishJob.create({
      data: {
        userId: user.id,
        videoAssetId: videoAsset.id,
        defaultCaption: defaultCaption.trim(),
        totalAccounts: accountIds.length,
        status: scheduledFor ? "PENDING" : "IN_PROGRESS",
        scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
        items: {
          create: accountIds.map((accountId: string) => ({
            accountId,
            customCaption: customCaptions?.[accountId] || null,
            status: "PENDING",
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 3. Handle Scheduling or Immediate Enqueue
    if (scheduledFor) {
      const scheduleDate = new Date(scheduledFor);
      const delayMs = scheduleDate.getTime() - Date.now();

      await prisma.schedule.create({
        data: {
          publishJobId: publishJob.id,
          scheduledFor: scheduleDate,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          status: "SCHEDULED",
        },
      });

      await enqueueScheduledJob(
        {
          publishJobId: publishJob.id,
          scheduledFor: scheduleDate.toISOString(),
        },
        delayMs
      );
    } else {
      // Fan-out to worker queue
      for (const item of publishJob.items) {
        await enqueuePublishJobItem({
          publishJobId: publishJob.id,
          publishJobItemId: item.id,
          accountId: item.accountId,
          videoAssetId: videoAsset.id,
          caption: item.customCaption || publishJob.defaultCaption,
        });
      }
    }

    return NextResponse.json({
      success: true,
      publishJobId: publishJob.id,
      totalAccounts: publishJob.totalAccounts,
      status: publishJob.status,
      message: scheduledFor
        ? `Bulk post scheduled for ${new Date(scheduledFor).toLocaleString()}`
        : `Publishing dispatched to ${accountIds.length} account(s)`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create publish job";
    console.error("Create publish job error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
