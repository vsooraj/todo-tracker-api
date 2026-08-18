const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.BASIC_AUTH_EMAIL || "demo@todotracker.local").toLowerCase();

  const demoUser = await prisma.user.upsert({
    where: { email },
    update: { name: "Demo User" },
    create: {
      email,
      name: "Demo User",
    },
  });

  console.log(`Seeded demo user: ${demoUser.email} (${demoUser.id})`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
