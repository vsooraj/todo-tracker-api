const workspaceRepository = require("../repositories/workspace.repository");
const projectRepository = require("../repositories/project.repository");
const taskRepository = require("../repositories/task.repository");

async function getWorkspaceMember(workspaceId, userId) {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) return { error: "Workspace not found" };
  const member = workspace.members.find((item) => item.userId === userId);
  if (!member) return { error: "You are not a member of this workspace" };
  return { workspace, member };
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "Done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate) < today;
}

async function getDashboard(userId, workspaceId) {
  const access = await getWorkspaceMember(workspaceId, userId);
  if (access.error) return { error: access.error };

  const projects = await projectRepository.findByWorkspace(workspaceId);
  const taskGroups = await Promise.all(
    projects.map(async (project) => {
      const tasks = await taskRepository.findByProject(project.id);
      return tasks.map((task) => ({ ...task, projectName: project.name }));
    })
  );
  const allTasks = taskGroups.flat();

  const statusCounts = {};
  allTasks.forEach((task) => {
    const label = isOverdue(task) ? "Overdue" : task.status;
    statusCounts[label] = (statusCounts[label] || 0) + 1;
  });

  const taskStatusBreakdown = Object.entries(statusCounts).map(([label, count]) => ({
    label,
    count,
    percentage: allTasks.length ? Math.round((count / allTasks.length) * 100) : 0,
  }));

  const myTasks = allTasks
    .filter((task) => task.assigneeId === userId && task.status !== "Done")
    .slice(0, 5);

  const overdueTasks = allTasks.filter(isOverdue).slice(0, 5);

  const planningCount = projects.filter((project) => project.status === "Planning").length;
  const completedCount = projects.filter((project) => project.status === "Completed").length;
  const activeTaskCount = allTasks.filter((task) => task.status === "In Progress").length;

  const recentActivity = [
    ...projects.slice(0, 2).map((project) => ({
      id: `activity-project-${project.id}`,
      message: `Project "${project.name}" is ${project.status.toLowerCase()}.`,
      timestamp: project.updatedAt,
      type: "project",
    })),
    ...allTasks.slice(-3).map((task) => ({
      id: `activity-task-${task.id}`,
      message: `Task "${task.title}" is ${task.status.toLowerCase()}.`,
      timestamp: task.createdAt,
      type: "task",
    })),
  ]
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .slice(0, 5);

  return {
    dashboard: {
      stats: {
        totalProjects: projects.length,
        planningProjects: planningCount,
        activeTasks: activeTaskCount,
        inProgressTasks: activeTaskCount,
        completedProjects: completedCount,
        completedPercentage: projects.length ? Math.round((completedCount / projects.length) * 100) : 0,
        overdueTasks: overdueTasks.length,
      },
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        progress: project.progress,
        endDate: project.endDate,
        memberCount: project.members.length,
      })),
      taskStatusBreakdown,
      myTasks,
      overdueTasks,
      recentActivity,
      workspace: {
        id: access.workspace.id,
        name: access.workspace.name,
        memberCount: access.workspace.members.length,
        role: access.member.role,
      },
    },
  };
}

module.exports = { getDashboard };
