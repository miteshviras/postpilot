import { NextRequest, NextResponse } from "next/server";
import { getTikTokAuthUrl } from "@/lib/tiktok";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";

// Helper to get or create the default user
async function getOrCreateDefaultUser() {
  return await prisma.user.upsert({
    where: { email: "creator@postpilot.app" },
    update: {},
    create: {
      email: "creator@postpilot.app",
      name: "Alex Vance",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    // In mock mode (e.g. testing or when user clicks "Connect Mock Account")
    if (body.mock === true) {
      const user = await getOrCreateDefaultUser();
      const randomSuffix = Math.floor(Math.random() * 900) + 100;
      const account = await prisma.tikTokAccount.create({
        data: {
          userId: user.id,
          openId: `mock_openid_${randomSuffix}_${Date.now()}`,
          displayName: `TikTok Creator ${randomSuffix}`,
          handle: `@creator_${randomSuffix}`,
          avatarUrl: `https://images.unsplash.com/photo-${1530000000000 + randomSuffix}?w=150&auto=format&fit=crop&q=80`,
          followerCount: Math.floor(Math.random() * 80000) + 5000,
          encryptedAccessToken: encryptToken(`mock_token_${randomSuffix}`),
          encryptedRefreshToken: encryptToken(`mock_refresh_${randomSuffix}`),
          tokenExpiresAt: new Date(Date.now() + 86400 * 1000),
          status: "ACTIVE",
          lastSyncAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        mock: true,
        account,
        message: "Demo TikTok account connected successfully",
      });
    }

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
