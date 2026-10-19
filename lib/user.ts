import { prisma } from "./db";

export async function getDefaultUser() {
  return await prisma.user.upsert({
    where: { email: "user@postpilot.app" },
    update: {},
    create: {
      email: "user@postpilot.app",
      name: "Creator",
    },
  });
}
