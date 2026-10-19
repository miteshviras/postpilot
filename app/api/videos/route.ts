import { NextRequest, NextResponse } from "next/server";
import { saveVideoFile } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/user";

// Allowed video MIME types
const ALLOWED_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB for local uploads

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No video file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mov|webm)$/i)) {
      return NextResponse.json(
        { success: false, error: "Invalid video format. Supported formats: MP4, MOV, WEBM." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 100MB limit." },
        { status: 400 }
      );
    }

    const user = await getDefaultUser();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to storage
    const stored = await saveVideoFile(buffer, file.name, file.type || "video/mp4");

    // Create VideoAsset in DB
    const asset = await prisma.videoAsset.create({
      data: {
        userId: user.id,
        originalName: stored.originalName,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: BigInt(stored.sizeBytes),
      },
    });

    return NextResponse.json({
      success: true,
      videoAsset: {
        id: asset.id,
        originalName: asset.originalName,
        publicUrl: stored.publicUrl,
        sizeBytes: Number(asset.sizeBytes),
        mimeType: asset.mimeType,
        createdAt: asset.createdAt,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process video upload";
    console.error("Video upload error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
