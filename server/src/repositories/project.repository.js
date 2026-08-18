const prisma = require("../lib/prisma");
const { mapProject, parseDateInput } = require("./mappers");

const projectInclude = {
  members: {
    orderBy: { joinedAt: "asc" },
  },
};

async function create(data) {
  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description || "",
        status: data.status || "Planning",
        priority: data.priority || "Medium",
        projectLeadId: data.projectLeadId,
        startDate: parseDateInput(data.startDate),
        endDate: parseDateInput(data.endDate),
        members: {
          create: (data.members || []).map((member) => ({
            userId: member.userId,
            role: member.role === "Lead" ? "Lead" : "Member",
          })),
        },
      },
      include: projectInclude,
    });

    return created;
  });

  return mapProject(project);
}

async function findById(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: projectInclude,
  });
  return project ? mapProject(project) : null;
}

async function findByWorkspace(workspaceId) {
  const projects = await prisma.project.findMany({
    where: { workspaceId, archived: false },
    include: projectInclude,
    orderBy: { createdAt: "desc" },
  });
  return projects.map(mapProject);
}

async function update(projectId, updates) {
  const data = { ...updates };

  if (Object.prototype.hasOwnProperty.call(data, "startDate")) {
    data.startDate = parseDateInput(data.startDate);
  }
  if (Object.prototype.hasOwnProperty.call(data, "endDate")) {
    data.endDate = parseDateInput(data.endDate);
  }

  delete data.members;

  const project = await prisma.project.update({
    where: { id: projectId },
    data,
    include: projectInclude,
  });

  return mapProject(project);
}

async function addMember(projectId, userId, role = "Member") {
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    update: { role: role === "Lead" ? "Lead" : "Member" },
    create: {
      projectId,
      userId,
      role: role === "Lead" ? "Lead" : "Member",
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  return {
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  };
}

async function syncLeadMembership(projectId, leadId) {
  await prisma.projectMember.updateMany({
    where: { projectId, role: "Lead", userId: { not: leadId } },
    data: { role: "Member" },
  });

  await addMember(projectId, leadId, "Lead");
}

async function isMember(projectId, userId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      projectLeadId: true,
      members: { select: { userId: true } },
    },
  });

  if (!project) return false;
  return project.projectLeadId === userId || project.members.some((member) => member.userId === userId);
}

async function countByWorkspace(workspaceId) {
  return prisma.project.count({ where: { workspaceId, archived: false } });
}

module.exports = {
  create,
  findById,
  findByWorkspace,
  update,
  addMember,
  syncLeadMembership,
  isMember,
  countByWorkspace,
};
