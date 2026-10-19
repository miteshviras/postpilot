import { prisma } from "../lib/db";
import { encryptToken } from "../lib/crypto";

async function main() {
  console.log("🌱 Seeding database with initial PostPilot demo data...");

  // 1. Create Demo User
  const user = await prisma.user.upsert({
    where: { email: "creator@postpilot.app" },
    update: {},
    create: {
      email: "creator@postpilot.app",
      name: "Alex Vance",
    },
  });

  console.log(`👤 User created: ${user.name} (${user.id})`);

  // 2. Create Sample TikTok Accounts
  const demoAccounts = [
    {
      openId: "tt_demo_fitness",
      displayName: "Alex Vance Fitness",
      handle: "@alex_fit",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      followerCount: 24500,
    },
    {
      openId: "tt_demo_daily",
      displayName: "Alex Vance Vlogs",
      handle: "@alex_vlogs",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      followerCount: 58200,
    },
    {
      openId: "tt_demo_business",
      displayName: "Vance Media Agency",
      handle: "@vancemedia",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      followerCount: 110400,
    },
  ];

  for (const acc of demoAccounts) {
    const existing = await prisma.tikTokAccount.findUnique({
      where: { openId: acc.openId },
    });

    if (!existing) {
      await prisma.tikTokAccount.create({
        data: {
          userId: user.id,
          openId: acc.openId,
          unionId: `union_${acc.openId}`,
          displayName: acc.displayName,
          handle: acc.handle,
          avatarUrl: acc.avatarUrl,
          followerCount: acc.followerCount,
          encryptedAccessToken: encryptToken(`mock_token_${acc.openId}`),
          encryptedRefreshToken: encryptToken(`mock_refresh_${acc.openId}`),
          tokenExpiresAt: new Date(Date.now() + 86400 * 1000), // 24 hours
          status: "ACTIVE",
          lastSyncAt: new Date(),
        },
      });
      console.log(`✅ Connected demo account: ${acc.displayName} (${acc.handle})`);
    }
  }

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
