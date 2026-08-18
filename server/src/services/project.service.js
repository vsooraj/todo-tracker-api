const workspaceRepository = require("../repositories/workspace.repository");
const projectRepository = require("../repositories/project.repository");
const taskRepository = require("../repositories/task.repository");
const {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
} = require("../schemas/project.schema");

async function getWorkspaceMember(workspaceId, userId) {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) return { error: "Workspace not found" };
  const member = workspace.members.find((item) => item.userId === userId);
  if (!member) return { error: "You are not a member of this workspace" };
  return { workspace, member };
}

function isWorkspaceAdmin(workspace, userId) {
  return workspace.members.some((member) => member.userId === userId && member.role === "Admin");
}

function isProjectLead(project, userId) {
  return project.projectLeadId === userId;
}

function canModifyProject(workspace, project, userId) {
  return isWorkspaceAdmin(workspace, userId) || isProjectLead(project, userId);
}

function canAccessProject(workspace, project, userId) {
  return (
    isWorkspaceAdmin(workspace, userId)
    || isProjectLead(project, userId)
    || project.members.some((member) => member.userId === userId)
  );
}

function normalizeDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(value).toISOString().slice(0, 10);
}

async function enrichProject(project, workspace) {
  const taskCount = await taskRepository.countByProject(project.id);
  const leadMember = workspace.members.find((member) => member.userId === project.projectLeadId);
  const accentIndex = Number(project.id.replace(/\D/g, "")) % 6;

  return {
    ...project,
    taskCount,
    memberCount: project.members.length,
    projectLeadName: leadMember?.name || leadMember?.email || project.projectLeadId,
    projectLeadRole: "Project Lead",
    accentColor: ["#6336df", "#2563eb", "#0891b2", "#059669", "#d97706", "#db2777"][accentIndex],
  };
}

async function create(userId, payload) {
  const parsed = createProjectSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((item) => item.message).join("; ") };
  }

  const data = parsed.data;
  const access = await getWorkspaceMember(data.workspaceId, userId);
  if (access.error) return { error: access.error };
  if (!isWorkspaceAdmin(access.workspace, userId)) {
    return { error: "Only workspace admins can create projects" };
  }

  const leadId = data.projectLeadId || userId;
  const leadIsMember = access.workspace.members.some((member) => member.userId === leadId);
  if (!leadIsMember) return { error: "Project lead must be a workspace member" };

  const members = [{ userId: leadId, role: "Lead", joinedAt: new Date().toISOString() }];
  data.teamMemberIds.forEach((memberId) => {
    if (memberId === leadId) return;
    const isMember = access.workspace.members.some((member) => member.userId === memberId);
    if (isMember) {
      members.push({ userId: memberId, role: "Member", joinedAt: new Date().toISOString() });
    }
  });

  const project = await projectRepository.create({
    workspaceId: data.workspaceId,
    name: data.name,
    description: data.description,
    status: data.status,
    priority: data.priority,
    projectLeadId: leadId,
    startDate: normalizeDate(data.startDate),
    endDate: normalizeDate(data.endDate),
    members,
  });

  await taskRepository.seedDemoTasks(project.id, leadId, data.name);
  return { project: await enrichProject(project, access.workspace) };
}

async function list(userId, workspaceId) {
  const access = await getWorkspaceMember(workspaceId, userId);
  if (access.error) return { error: access.error };

  const items = await projectRepository.findByWorkspace(workspaceId);
  const visible = items.filter((project) => canAccessProject(access.workspace, project, userId));
  const projects = await Promise.all(visible.map((project) => enrichProject(project, access.workspace)));
  return { projects };
}

async function getById(userId, projectId) {
  const project = await projectRepository.findById(projectId);
  if (!project) return { error: "Project not found" };

  const access = await getWorkspaceMember(project.workspaceId, userId);
  if (access.error) return { error: access.error };
  if (!canAccessProject(access.workspace, project, userId)) {
    return { error: "You do not have access to this project" };
  }

  return { project, workspace: access.workspace };
}

async function update(userId, projectId, payload) {
  const parsed = updateProjectSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((item) => item.message).join("; ") };
  }

  const project = await projectRepository.findById(projectId);
  if (!project) return { error: "Project not found" };

  const access = await getWorkspaceMember(project.workspaceId, userId);
  if (access.error) return { error: access.error };
  if (!canModifyProject(access.workspace, project, userId)) {
    return { error: "Only workspace admins or project leads can update projects" };
  }

  const updates = { ...parsed.data };
  if (Object.prototype.hasOwnProperty.call(updates, "startDate")) {
    updates.startDate = normalizeDate(updates.startDate);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "endDate")) {
    updates.endDate = normalizeDate(updates.endDate);
  }

  if (updates.projectLeadId) {
    const leadIsMember = access.workspace.members.some((member) => member.userId === updates.projectLeadId);
    if (!leadIsMember) return { error: "Project lead must be a workspace member" };
    await projectRepository.syncLeadMembership(projectId, updates.projectLeadId);
    updates.projectLeadId = updates.projectLeadId;
  }

  const updated = await projectRepository.update(projectId, updates);
  return { project: await enrichProject(updated, access.workspace) };
}

async function addMember(userId, projectId, payload) {
  const parsed = addProjectMemberSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((item) => item.message).join("; ") };
  }

  const project = await projectRepository.findById(projectId);
  if (!project) return { error: "Project not found" };

  const access = await getWorkspaceMember(project.workspaceId, userId);
  if (access.error) return { error: access.error };
  if (!canModifyProject(access.workspace, project, userId)) {
    return { error: "Only workspace admins or project leads can assign project members" };
  }

  const targetIsMember = access.workspace.members.some((member) => member.userId === parsed.data.userId);
  if (!targetIsMember) return { error: "User must be a workspace member before joining a project" };

  const member = await projectRepository.addMember(projectId, parsed.data.userId, "Member");
  const refreshedProject = await projectRepository.findById(projectId);
  return { member, project: refreshedProject };
}

async function getAnalytics(userId, projectId) {
  const result = await getById(userId, projectId);
  if (result.error) return result;

  const [byStatus, byType, byPriority, totalTasks] = await Promise.all([
    taskRepository.groupByField(projectId, "status"),
    taskRepository.groupByField(projectId, "type"),
    taskRepository.groupByField(projectId, "priority"),
    taskRepository.countByProject(projectId),
  ]);

  return {
    analytics: {
      byStatus,
      byType,
      byPriority,
      totalTasks,
    },
  };
}

async function getCalendar(userId, projectId, year, month) {
  const result = await getById(userId, projectId);
  if (result.error) return result;

  const resolvedYear = Number(year) || new Date().getFullYear();
  const resolvedMonth = Number(month) || new Date().getMonth() + 1;
  const tasks = await taskRepository.findByProjectAndMonth(projectId, resolvedYear, resolvedMonth);

  const byDate = {};
  tasks.forEach((task) => {
    const key = task.dueDate;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push({
      id: task.id,
      title: task.title,
      status: task.status,
      type: task.type,
      priority: task.priority,
    });
  });

  return {
    calendar: {
      year: resolvedYear,
      month: resolvedMonth,
      tasksByDate: byDate,
    },
  };
}

module.exports = {
  create,
  list,
  getById,
  update,
  addMember,
  getAnalytics,
  getCalendar,
  getWorkspaceMember,
  canAccessProject,
  isWorkspaceAdmin,
  isProjectLead,
};
