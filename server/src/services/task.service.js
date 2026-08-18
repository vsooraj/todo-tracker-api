const projectRepository = require("../repositories/project.repository");
const workspaceRepository = require("../repositories/workspace.repository");
const taskRepository = require("../repositories/task.repository");
const projectService = require("./project.service");
const { createTaskSchema, updateTaskSchema } = require("../schemas/task.schema");
const { addCommentSchema, bulkDeleteSchema } = require("../schemas/comment.schema");

function resolveMemberName(workspace, userId) {
  if (!userId) return "Unassigned";
  const member = workspace.members.find((item) => item.userId === userId);
  return member?.name || member?.email || userId;
}

async function enrichTask(task, workspace, project = null) {
  const completedSubtasks = (task.subtasks || []).filter((item) => item.completed).length;
  const commentCount = await taskRepository.getCommentCount(task.id);
  return {
    ...task,
    projectName: project?.name || null,
    assigneeName: resolveMemberName(workspace, task.assigneeId),
    reporterName: resolveMemberName(workspace, task.reporterId),
    commentCount,
    completedSubtasks,
    totalSubtasks: task.subtasks?.length || 0,
  };
}

function enrichComment(comment, workspace) {
  return {
    ...comment,
    authorName: resolveMemberName(workspace, comment.userId),
  };
}

function enrichActivity(entry, workspace) {
  return {
    ...entry,
    userName: resolveMemberName(workspace, entry.userId),
  };
}

async function canAccessProject(userId, projectId) {
  const result = await projectService.getById(userId, projectId);
  if (result.error) return { error: result.error };
  return {
    project: result.project,
    workspace: result.workspace,
    member: result.workspace.members.find((item) => item.userId === userId),
  };
}

async function listByProject(userId, projectId) {
  const access = await canAccessProject(userId, projectId);
  if (access.error) return { error: access.error };

  const tasks = await taskRepository.findByProject(projectId);
  const enrichedTasks = await Promise.all(
    tasks.map((task) => enrichTask(task, access.workspace, access.project))
  );
  const columns = taskRepository.KANBAN_STATUSES.map((status) => ({
    status,
    tasks: enrichedTasks.filter((task) => task.status === status),
  }));

  return { board: { columns, tasks: enrichedTasks } };
}

async function getDetail(userId, taskId) {
  const task = await taskRepository.findById(taskId);
  if (!task) return { error: "Task not found" };
  const access = await canAccessProject(userId, task.projectId);
  if (access.error) return { error: access.error };

  const [comments, activity] = await Promise.all([
    taskRepository.getComments(taskId),
    taskRepository.getActivities(taskId),
  ]);

  return {
    detail: {
      task: await enrichTask(task, access.workspace, access.project),
      comments: comments.map((comment) => enrichComment(comment, access.workspace)),
      activity: activity.map((entry) => enrichActivity(entry, access.workspace)),
      project: { id: access.project.id, name: access.project.name },
    },
  };
}

async function getById(userId, taskId) {
  const result = await getDetail(userId, taskId);
  if (result.error) return result;
  return { task: result.detail.task };
}

async function create(userId, projectId, payload) {
  const parsed = createTaskSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((item) => item.message).join("; ") };
  }

  const access = await canAccessProject(userId, projectId);
  if (access.error) return { error: access.error };

  const task = await taskRepository.create({
    projectId,
    projectPrefix: access.project.name,
    ...parsed.data,
    reporterId: userId,
    assigneeId: parsed.data.assigneeId || userId,
  });

  return { task: await enrichTask(task, access.workspace, access.project) };
}

async function update(userId, taskId, payload) {
  const parsed = updateTaskSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((item) => item.message).join("; ") };
  }

  const existing = await taskRepository.findById(taskId);
  if (!existing) return { error: "Task not found" };

  const access = await canAccessProject(userId, existing.projectId);
  if (access.error) return { error: access.error };

  const updates = { ...parsed.data };
  if (updates.status === "Done" && updates.progress === undefined) {
    updates.progress = 100;
  }

  const task = await taskRepository.update(taskId, updates, userId);
  return { task: await enrichTask(task, access.workspace, access.project) };
}

async function bulkDelete(userId, payload) {
  const parsed = bulkDeleteSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((item) => item.message).join("; ") };
  }

  const taskIds = parsed.data.taskIds;
  const firstTask = await taskRepository.findById(taskIds[0]);
  if (!firstTask) return { error: "Task not found" };

  const access = await canAccessProject(userId, firstTask.projectId);
  if (access.error) return { error: access.error };

  const tasks = await taskRepository.findByIds(taskIds);
  const allSameProject = tasks.length === taskIds.length
    && tasks.every((task) => task.projectId === firstTask.projectId);
  if (!allSameProject) return { error: "All tasks must belong to the same project" };

  const deletedCount = await taskRepository.bulkDelete(taskIds);
  return { deletedCount };
}

async function myTasks(userId, workspaceId) {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) return { error: "Workspace not found" };
  const member = workspace.members.find((item) => item.userId === userId);
  if (!member) return { error: "You are not a member of this workspace" };

  const projects = await projectRepository.findByWorkspace(workspaceId);
  const projectIds = new Set(projects.map((project) => project.id));
  const projectMap = new Map(projects.map((project) => [project.id, project]));

  const tasks = await taskRepository.findByAssignee(userId);
  const filtered = tasks.filter((task) => projectIds.has(task.projectId));
  const enriched = await Promise.all(
    filtered.map((task) => enrichTask(task, workspace, projectMap.get(task.projectId)))
  );

  return { tasks: enriched };
}

async function addComment(userId, payload) {
  const parsed = addCommentSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((item) => item.message).join("; ") };
  }

  const task = await taskRepository.findById(parsed.data.taskId);
  if (!task) return { error: "Task not found" };

  const access = await canAccessProject(userId, task.projectId);
  if (access.error) return { error: access.error };

  const comment = await taskRepository.addComment(parsed.data.taskId, userId, parsed.data.content);
  return { comment: enrichComment(comment, access.workspace) };
}

async function getComments(userId, taskId) {
  const task = await taskRepository.findById(taskId);
  if (!task) return { error: "Task not found" };
  const access = await canAccessProject(userId, task.projectId);
  if (access.error) return { error: access.error };

  const comments = await taskRepository.getComments(taskId);
  return {
    comments: comments.map((comment) => enrichComment(comment, access.workspace)),
  };
}

module.exports = {
  listByProject,
  getDetail,
  getById,
  create,
  update,
  bulkDelete,
  myTasks,
  addComment,
  getComments,
};
