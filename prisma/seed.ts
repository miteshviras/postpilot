import { prisma } from "../lib/db";
import { getDefaultUser } from "../lib/user";

async function main() {
  const user = await getDefaultUser();
  console.log(`✨ PostPilot user initialized: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error("Initialization failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
