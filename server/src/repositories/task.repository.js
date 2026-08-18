const prisma = require("../lib/prisma");
const { mapTask, mapComment, mapActivity, parseDateInput } = require("./mappers");

const KANBAN_STATUSES = ["To Do", "In Progress", "In Review", "Done"];

function buildTaskPrefix(projectName = "PRJ") {
  return projectName
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase() || "TSK";
}

async function nextTaskNumber(projectId, projectName = "PRJ") {
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { taskCounter: { increment: 1 } },
    select: { taskCounter: true },
  });

  return `${buildTaskPrefix(projectName)}-${project.taskCounter}`;
}

async function addActivity(taskId, userId, action, detail = "") {
  const activity = await prisma.taskActivity.create({
    data: { taskId, userId, action, detail },
  });
  return mapActivity(activity);
}

async function create(data) {
  const taskNumber = data.taskNumber || await nextTaskNumber(data.projectId, data.projectPrefix);

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        projectId: data.projectId,
        taskNumber,
        title: data.title,
        description: data.description || "",
        type: data.type || "Task",
        priority: data.priority || "Medium",
        assigneeId: data.assigneeId || null,
        reporterId: data.reporterId || data.assigneeId || null,
        status: data.status || "To Do",
        progress: data.progress ?? 0,
        dueDate: parseDateInput(data.dueDate),
        sprint: data.sprint || "Sprint 1",
        tags: data.tags || [],
        subtasks: data.subtasks || [],
        collaborators: data.collaborators || [],
        estimatedEffortHours: data.estimatedEffortHours ?? 8,
        timeLoggedMinutes: data.timeLoggedMinutes ?? 0,
        category: data.category || "Development",
        impact: data.impact || "Medium",
        risk: data.risk || "Medium",
        environment: data.environment || "Staging",
        relatedEpic: data.relatedEpic || null,
        dependsOn: data.dependsOn || [],
        blocks: data.blocks || [],
      },
    });

    await tx.taskActivity.create({
      data: {
        taskId: created.id,
        userId: created.reporterId,
        action: "created task",
        detail: created.title,
      },
    });

    return created;
  });

  return mapTask(task);
}

async function findById(taskId) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  return task ? mapTask(task) : null;
}

async function findByProject(projectId) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });
  return tasks.map(mapTask);
}

async function findByAssignee(userId) {
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: "Done" },
    },
    orderBy: { dueDate: "asc" },
  });
  return tasks.map(mapTask);
}

async function findByIds(taskIds) {
  const tasks = await prisma.task.findMany({ where: { id: { in: taskIds } } });
  return tasks.map(mapTask);
}

async function update(taskId, updates, actorId = null) {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) return null;

  const data = { ...updates };
  if (Object.prototype.hasOwnProperty.call(data, "dueDate")) {
    data.dueDate = parseDateInput(data.dueDate);
  }

  const task = await prisma.$transaction(async (tx) => {
    if (data.status && data.status !== existing.status) {
      await tx.taskActivity.create({
        data: {
          taskId,
          userId: actorId || existing.reporterId,
          action: "changed status",
          detail: `${existing.status} → ${data.status}`,
        },
      });
    }

    const updated = await tx.task.update({
      where: { id: taskId },
      data,
    });

    return updated;
  });

  return mapTask(task);
}

async function bulkDelete(taskIds) {
  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.task.deleteMany({ where: { id: { in: taskIds } } });
    return deleted.count;
  });
  return result;
}

async function getCommentCount(taskId) {
  return prisma.comment.count({ where: { taskId } });
}

async function addComment(taskId, userId, content) {
  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: { taskId, userId, content },
    });

    await tx.taskActivity.create({
      data: {
        taskId,
        userId,
        action: "commented",
        detail: content.slice(0, 80),
      },
    });

    return created;
  });

  return mapComment(comment);
}

async function getComments(taskId) {
  const comments = await prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
  });
  return comments.map(mapComment);
}

async function getActivities(taskId) {
  const activities = await prisma.taskActivity.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
  });
  return activities.map(mapActivity);
}

async function seedDemoTasks(projectId, projectLeadId, projectName = "Project") {
  const demoTasks = [
    { title: "User Authentication Module", status: "To Do", priority: "High", progress: 0, tags: ["Backend", "Security"] },
    {
      title: "Design API endpoints for account summary",
      status: "In Progress",
      priority: "High",
      progress: 25,
      tags: ["Backend", "API", "Accounts"],
      description: "Design and document REST API endpoints for account summary including balance, hold amount, and transaction overview modules.",
      subtasks: [
        { id: "sub-1", title: "Design API endpoints", completed: true, status: "Done" },
        { id: "sub-2", title: "Implement service layer", completed: true, status: "Done" },
        { id: "sub-3", title: "Integration testing", completed: false, status: "To Do" },
        { id: "sub-4", title: "Unit testing", completed: false, status: "To Do" },
      ],
    },
    { title: "Transaction History UI", status: "In Progress", priority: "Medium", progress: 35, tags: ["Frontend"] },
    { title: "Payment Gateway Integration", status: "In Review", priority: "High", progress: 90, tags: ["Integration"] },
    { title: "Push Notification Setup", status: "In Review", priority: "Medium", progress: 85, tags: ["Mobile"] },
    { title: "Biometric Login", status: "To Do", priority: "Low", progress: 0, tags: ["Mobile", "Security"] },
    { title: "Dashboard Analytics Widget", status: "Done", priority: "Medium", progress: 100, tags: ["Frontend"] },
    { title: "Security Audit Fixes", status: "Done", priority: "High", progress: 100, tags: ["Security"] },
  ];

  const today = new Date();

  for (let index = 0; index < demoTasks.length; index += 1) {
    const item = demoTasks[index];
    const due = new Date(today);
    due.setDate(due.getDate() + (index + 2) * 3);

    const task = await create({
      projectId,
      projectPrefix: projectName,
      title: item.title,
      description: item.description || "",
      type: index === 1 ? "Feature" : "Task",
      priority: item.priority,
      assigneeId: projectLeadId,
      reporterId: projectLeadId,
      status: item.status,
      progress: item.progress,
      dueDate: due.toISOString().slice(0, 10),
      sprint: index < 4 ? "Sprint 3 (Current)" : "Sprint 2",
      tags: item.tags,
      subtasks: item.subtasks || [],
      relatedEpic: index === 1 ? "EP-12 Account Management" : null,
      timeLoggedMinutes: index === 1 ? 135 : 0,
    });

    if (index === 1) {
      await addComment(task.id, projectLeadId, "Please align with the OpenAPI standards we agreed on.");
      await addComment(task.id, projectLeadId, "Updated requirements attached.");
      await addActivity(task.id, projectLeadId, "logged time", "2h 15m");
    } else if (index % 2 === 0) {
      await addComment(task.id, projectLeadId, "Updated requirements attached.");
    }
  }
}

async function groupByField(projectId, field) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { [field]: true },
  });

  const counts = {};
  tasks.forEach((task) => {
    const key = task[field] || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

async function findByProjectAndMonth(projectId, year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      dueDate: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return tasks.map(mapTask);
}

async function countByProject(projectId) {
  return prisma.task.count({ where: { projectId } });
}

module.exports = {
  KANBAN_STATUSES,
  create,
  findById,
  findByProject,
  findByAssignee,
  findByIds,
  update,
  bulkDelete,
  seedDemoTasks,
  groupByField,
  findByProjectAndMonth,
  getCommentCount,
  addComment,
  getComments,
  getActivities,
  addActivity,
  countByProject,
};
