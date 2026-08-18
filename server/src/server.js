const app = require("./app");
const prisma = require("./lib/prisma");

const port = process.env.PORT || 5000;

async function start() {
  try {
    await prisma.$connect();
    app.listen(port, () => {
      console.log(`Kairos API listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error.message);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
