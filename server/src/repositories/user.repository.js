const prisma = require("../lib/prisma");

async function findById(userId) {
  return prisma.user.findUnique({ where: { id: userId } });
}

async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

async function findOrCreateByEmail(email, name = null) {
  const normalizedEmail = email.toLowerCase();
  return prisma.user.upsert({
    where: { email: normalizedEmail },
    update: name ? { name } : {},
    create: {
      email: normalizedEmail,
      name,
    },
  });
}

async function findOrCreateByClerk(clerkUserId, email, name = null, imageUrl = null) {
  const existing = await prisma.user.findUnique({ where: { clerkUserId } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { email: email?.toLowerCase() || existing.email, name: name || existing.name, imageUrl },
    });
  }

  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (byEmail) {
      return prisma.user.update({
        where: { id: byEmail.id },
        data: { clerkUserId, name: name || byEmail.name, imageUrl },
      });
    }
  }

  return prisma.user.create({
    data: {
      clerkUserId,
      email: email.toLowerCase(),
      name,
      imageUrl,
    },
  });
}

module.exports = {
  findById,
  findByEmail,
  findOrCreateByEmail,
  findOrCreateByClerk,
};
