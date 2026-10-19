import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueuePublishJobItem } from "@/lib/queue";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { itemId } = body; // Optional: retry specific item or all failed

    const publishJob = await prisma.publishJob.findUnique({
      where: { id },
      include: {
        videoAsset: true,
        items: true,
      },
    });

    if (!publishJob) {
      return NextResponse.json(
        { success: false, error: "Publish job not found" },
        { status: 404 }
      );
    }

    // Filter items to retry
    const itemsToRetry = publishJob.items.filter((item) => {
      if (itemId) return item.id === itemId;
      return item.status === "FAILED";
    });

    if (itemsToRetry.length === 0) {
      return NextResponse.json(
        { success: false, message: "No failed items found to retry" },
        { status: 400 }
      );
    }

    // Reset items to PENDING
    await prisma.publishJobItem.updateMany({
      where: {
        id: { in: itemsToRetry.map((i) => i.id) },
      },
      data: {
        status: "PENDING",
        errorMessage: null,
      },
    });

    // Update parent status back to IN_PROGRESS
    await prisma.publishJob.update({
      where: { id },
      data: { status: "IN_PROGRESS" },
    });

    // Enqueue retry jobs
    for (const item of itemsToRetry) {
      try {
        await enqueuePublishJobItem({
          publishJobId: publishJob.id,
          publishJobItemId: item.id,
          accountId: item.accountId,
          videoAssetId: publishJob.videoAssetId,
          caption: item.customCaption || publishJob.defaultCaption,
          isRetry: true,
        });
      } catch (queueErr: unknown) {
        const queueErrMsg = queueErr instanceof Error ? queueErr.message : "Queue notice";
        console.warn(`Retry queue notice for item ${item.id}:`, queueErrMsg);
      }
    }

    return NextResponse.json({
      success: true,
      retriedCount: itemsToRetry.length,
      message: `Retrying ${itemsToRetry.length} failed post(s)`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retry job";
    console.error("Retry publish job error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
