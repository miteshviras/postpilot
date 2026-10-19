import { NextResponse } from "next/server";
import { getTikTokAuthUrl } from "@/lib/tiktok";
import crypto from "crypto";

export async function POST() {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    const authUrl = getTikTokAuthUrl(state);

    return NextResponse.json({
      success: true,
      authUrl,
      state,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate TikTok connection URL";
    console.error("TikTok connect error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
