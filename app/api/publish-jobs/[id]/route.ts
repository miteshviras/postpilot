import { NextRequest, NextResponse, connection } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  try {
    const { id } = await params;

    const job = await prisma.publishJob.findUnique({
      where: { id },
      include: {
        videoAsset: true,
        items: {
          include: {
            account: {
              select: {
                id: true,
                displayName: true,
                handle: true,
                avatarUrl: true,
                followerCount: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        schedule: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Publish job not found" },
        { status: 404 }
      );
    }

    // Calculate percentage progress
    const total = job.items.length;
    const published = job.items.filter((i) => i.status === "PUBLISHED").length;
    const failed = job.items.filter((i) => i.status === "FAILED").length;
    const processing = job.items.filter((i) => i.status === "UPLOADING" || i.status === "PROCESSING").length;
    const completedCount = published + failed;
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        videoAsset: {
          ...job.videoAsset,
          sizeBytes: Number(job.videoAsset.sizeBytes),
          publicUrl: `/uploads/${job.videoAsset.storageKey}`,
        },
        progressPercent,
        publishedCount: published,
        failedCount: failed,
        processingCount: processing,
        isCompleted: completedCount === total,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch publish job";
    console.error("Failed to fetch publish job:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
