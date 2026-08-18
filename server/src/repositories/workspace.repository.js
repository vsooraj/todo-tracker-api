const prisma = require("../lib/prisma");
const { mapWorkspace, mapInvitation } = require("./mappers");

const workspaceInclude = {
  members: {
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  },
};

async function create({ name, slug, ownerId, logoUrl = null }) {
  const workspace = await prisma.$transaction(async (tx) => {
    const created = await tx.workspace.create({
      data: {
        name,
        slug,
        imageUrl: logoUrl,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: "Admin",
          },
        },
      },
      include: workspaceInclude,
    });

    await tx.userActiveWorkspace.upsert({
      where: { userId: ownerId },
      update: { workspaceId: created.id },
      create: { userId: ownerId, workspaceId: created.id },
    });

    return created;
  });

  return mapWorkspace(workspace);
}

async function findByMember(userId) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: { include: workspaceInclude },
    },
    orderBy: { joinedAt: "asc" },
  });

  const active = await prisma.userActiveWorkspace.findUnique({ where: { userId } });

  return memberships
    .map((membership) => mapWorkspace(membership.workspace))
    .sort((left, right) => {
      const leftPriority = active?.workspaceId === left.id ? 0 : 1;
      const rightPriority = active?.workspaceId === right.id ? 0 : 1;
      return leftPriority - rightPriority;
    });
}

async function findBySlug(slug) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: workspaceInclude,
  });
  return workspace ? mapWorkspace(workspace) : null;
}

async function findById(workspaceId) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: workspaceInclude,
  });
  return workspace ? mapWorkspace(workspace) : null;
}

async function getActiveWorkspace(userId) {
  const active = await prisma.userActiveWorkspace.findUnique({
    where: { userId },
    include: {
      workspace: { include: workspaceInclude },
    },
  });

  if (active?.workspace) {
    const isMember = active.workspace.members.some((member) => member.userId === userId);
    if (isMember) return mapWorkspace(active.workspace);
  }

  const firstMembership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: { include: workspaceInclude } },
    orderBy: { joinedAt: "asc" },
  });

  if (!firstMembership) return null;

  await prisma.userActiveWorkspace.upsert({
    where: { userId },
    update: { workspaceId: firstMembership.workspaceId },
    create: { userId, workspaceId: firstMembership.workspaceId },
  });

  return mapWorkspace(firstMembership.workspace);
}

async function setActiveWorkspace(userId, workspaceId) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    include: { workspace: { include: workspaceInclude } },
  });

  if (!membership) return null;

  await prisma.userActiveWorkspace.upsert({
    where: { userId },
    update: { workspaceId },
    create: { userId, workspaceId },
  });

  return mapWorkspace(membership.workspace);
}

async function createInvitation({ workspaceId, inviteeEmail, invitedByUserId }) {
  const existing = await prisma.invitation.findFirst({
    where: {
      workspaceId,
      inviteeEmail: inviteeEmail.toLowerCase(),
      status: "pending",
    },
  });
  if (existing) return mapInvitation(existing);

  const invitation = await prisma.invitation.create({
    data: {
      workspaceId,
      inviteeEmail: inviteeEmail.toLowerCase(),
      invitedByUserId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return mapInvitation(invitation);
}

async function acceptInvitation(invitationId, userId, userEmail, userName) {
  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.status !== "pending") return null;
  if (invitation.inviteeEmail !== userEmail.toLowerCase()) return null;

  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { name: userName || undefined },
    });

    await tx.workspaceMember.upsert({
      where: { userId_workspaceId: { userId, workspaceId: invitation.workspaceId } },
      update: {},
      create: {
        userId,
        workspaceId: invitation.workspaceId,
        role: "Member",
      },
    });

    const updatedInvitation = await tx.invitation.update({
      where: { id: invitationId },
      data: { status: "accepted", acceptedAt: new Date() },
    });

    const workspace = await tx.workspace.findUnique({
      where: { id: invitation.workspaceId },
      include: workspaceInclude,
    });

    return { workspace: mapWorkspace(workspace), invitation: mapInvitation(updatedInvitation) };
  });

  return result;
}

async function getInvitationsForWorkspace(workspaceId) {
  const invitations = await prisma.invitation.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return invitations.map(mapInvitation);
}

async function getInvitationsForUser(userEmail) {
  const invitations = await prisma.invitation.findMany({
    where: {
      inviteeEmail: userEmail.toLowerCase(),
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });
  return invitations.map(mapInvitation);
}

module.exports = {
  create,
  findByMember,
  findBySlug,
  findById,
  getActiveWorkspace,
  setActiveWorkspace,
  createInvitation,
  acceptInvitation,
  getInvitationsForWorkspace,
  getInvitationsForUser,
};
