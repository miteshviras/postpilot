import { NextResponse, connection } from "next/server";
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

export async function GET() {
  await connection();
  try {
    const user = await getOrCreateDefaultUser();

    const accounts = await prisma.tikTokAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        openId: true,
        displayName: true,
        handle: true,
        avatarUrl: true,
        followerCount: true,
        status: true,
        lastSyncAt: true,
        lastPublishAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch accounts";
    console.error("Failed to fetch accounts:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
