import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getTikTokUserProfile } from "@/lib/tiktok";
import { encryptToken } from "@/lib/crypto";
import { prisma } from "@/lib/db";

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

  if (error || !code) {
    console.error("TikTok OAuth error callback:", error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}/accounts?error=${encodeURIComponent(errorDescription || error || "Authorization cancelled")}`
    );
  }

  try {
    const user = await getOrCreateDefaultUser();

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Fetch user profile
    const profile = await getTikTokUserProfile(tokens.accessToken);

    // Upsert connected TikTok account
    await prisma.tikTokAccount.upsert({
      where: { openId: tokens.openId },
      update: {
        encryptedAccessToken: encryptToken(tokens.accessToken),
        encryptedRefreshToken: encryptToken(tokens.refreshToken),
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        refreshExpiresAt: tokens.refreshExpiresIn
          ? new Date(Date.now() + tokens.refreshExpiresIn * 1000)
          : null,
        displayName: profile.displayName,
        handle: profile.handle,
        avatarUrl: profile.avatarUrl,
        followerCount: profile.followerCount || 0,
        status: "ACTIVE",
        lastSyncAt: new Date(),
      },
      create: {
        userId: user.id,
        openId: tokens.openId,
        unionId: tokens.unionId || profile.unionId,
        displayName: profile.displayName,
        handle: profile.handle,
        avatarUrl: profile.avatarUrl,
        followerCount: profile.followerCount || 0,
        encryptedAccessToken: encryptToken(tokens.accessToken),
        encryptedRefreshToken: encryptToken(tokens.refreshToken),
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        refreshExpiresAt: tokens.refreshExpiresIn
          ? new Date(Date.now() + tokens.refreshExpiresIn * 1000)
          : null,
        scope: tokens.scope,
        status: "ACTIVE",
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.redirect(`${baseUrl}/accounts?success=Account+connected+successfully`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to complete account connection";
    console.error("Error exchanging TikTok OAuth code:", err);
    return NextResponse.redirect(
      `${baseUrl}/accounts?error=${encodeURIComponent(message)}`
    );
  }
}
