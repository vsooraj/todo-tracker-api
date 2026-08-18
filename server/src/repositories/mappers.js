function toIsoDate(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function mapWorkspaceMember(member) {
  return {
    userId: member.userId,
    role: member.role,
    email: member.user?.email || null,
    name: member.user?.name || null,
    joinedAt: member.joinedAt?.toISOString?.() || member.joinedAt,
  };
}

function mapWorkspace(workspace) {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    logoUrl: workspace.imageUrl || null,
    status: workspace.status,
    ownerId: workspace.ownerId,
    members: (workspace.members || []).map(mapWorkspaceMember),
    createdAt: workspace.createdAt.toISOString(),
  };
}

function mapProjectMember(member) {
  return {
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  };
}

function mapProject(project) {
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    progress: project.progress,
    projectLeadId: project.projectLeadId,
    startDate: toIsoDate(project.startDate),
    endDate: toIsoDate(project.endDate),
    archived: project.archived,
    members: (project.members || []).map(mapProjectMember),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

function mapTask(task) {
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  return {
    id: task.id,
    projectId: task.projectId,
    taskNumber: task.taskNumber,
    title: task.title,
    description: task.description,
    type: task.type,
    priority: task.priority,
    assigneeId: task.assigneeId,
    reporterId: task.reporterId,
    status: task.status,
    progress: task.progress,
    dueDate: toIsoDate(task.dueDate),
    sprint: task.sprint,
    tags: task.tags || [],
    subtasks,
    collaborators: task.collaborators || [],
    estimatedEffortHours: task.estimatedEffortHours,
    timeLoggedMinutes: task.timeLoggedMinutes,
    category: task.category,
    impact: task.impact,
    risk: task.risk,
    environment: task.environment,
    relatedEpic: task.relatedEpic,
    dependsOn: task.dependsOn || [],
    blocks: task.blocks || [],
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

function mapComment(comment) {
  return {
    id: comment.id,
    taskId: comment.taskId,
    userId: comment.userId,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  };
}

function mapActivity(activity) {
  return {
    id: activity.id,
    taskId: activity.taskId,
    userId: activity.userId,
    action: activity.action,
    detail: activity.detail,
    createdAt: activity.createdAt.toISOString(),
  };
}

function mapInvitation(invitation) {
  return {
    id: invitation.id,
    workspaceId: invitation.workspaceId,
    inviteeEmail: invitation.inviteeEmail,
    invitedByUserId: invitation.invitedByUserId,
    status: invitation.status,
    createdAt: invitation.createdAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt?.toISOString() || null,
  };
}

function parseDateInput(value) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

module.exports = {
  mapWorkspace,
  mapProject,
  mapTask,
  mapComment,
  mapActivity,
  mapInvitation,
  parseDateInput,
  toIsoDate,
};
