const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function loginWithBasicCredentials(email, password) {
  const authorization = `Basic ${btoa(`${email}:${password}`)}`;
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: authorization },
  });
  if (!response.ok) throw new Error("Email or password is incorrect.");
  const data = await response.json();
  sessionStorage.setItem("basic-authorization", authorization);
  sessionStorage.setItem("user-id", data.id || "local-demo-user");
  sessionStorage.setItem("user-name", data.name || "Demo User");
  sessionStorage.setItem("needs-workspace-setup", data.needsWorkspaceSetup ? "true" : "false");
  return data;
}

function basicHeaders() {
  return { Authorization: sessionStorage.getItem("basic-authorization") || "" };
}

export async function getWorkspaces() {
  const response = await fetch(`${apiBaseUrl}/api/v1/workspaces`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load workspaces.");
  return response.json();
}

export async function createWorkspace(payload) {
  const body = typeof payload === "string" ? { name: payload } : payload;
  const response = await fetch(`${apiBaseUrl}/api/v1/workspaces`, {
    method: "POST",
    headers: { ...basicHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to create the workspace.");
  return data;
}

export async function activateWorkspace(workspaceId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/workspaces/${workspaceId}/activate`, {
    method: "POST",
    headers: basicHeaders(),
  });
  if (!response.ok) throw new Error("Unable to switch the workspace.");
  return response.json();
}

export async function getSlugAvailability(slug) {
  const response = await fetch(`${apiBaseUrl}/api/v1/workspaces/slug-availability?slug=${encodeURIComponent(slug)}`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to validate the workspace slug.");
  return response.json();
}

export async function getCurrentUser(getToken) {
  const token = await getToken();
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error("Unable to load the current user.");
  return response.json();
}

export async function inviteUserToWorkspace(workspaceId, inviteeEmail) {
  const response = await fetch(`${apiBaseUrl}/api/v1/invitations`, {
    method: "POST",
    headers: { ...basicHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, inviteeEmail }),
  });
  if (!response.ok) throw new Error("Unable to send invitation.");
  return response.json();
}

export async function acceptInvitation(invitationId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/invitations/${invitationId}/accept`, {
    method: "POST",
    headers: basicHeaders(),
  });
  if (!response.ok) throw new Error("Unable to accept invitation.");
  return response.json();
}

export async function getPendingInvitations() {
  const response = await fetch(`${apiBaseUrl}/api/v1/invitations/pending`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load invitations.");
  return response.json();
}

export async function getWorkspaceInvitations(workspaceId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/invitations/workspace/${workspaceId}`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load workspace invitations.");
  return response.json();
}

export async function getProjects(workspaceId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects?workspaceId=${encodeURIComponent(workspaceId)}`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load projects.");
  return response.json();
}

export async function createProject(payload) {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects`, {
    method: "POST",
    headers: { ...basicHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to create the project.");
  return data;
}

export async function updateProject(projectId, payload) {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}`, {
    method: "PUT",
    headers: { ...basicHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to update the project.");
  return data;
}

export async function addProjectMember(projectId, userId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/add-member`, {
    method: "POST",
    headers: { ...basicHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to add project member.");
  return data;
}

export async function getProjectAnalytics(projectId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/analytics`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load project analytics.");
  return response.json();
}

export async function getProjectCalendar(projectId, year, month) {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/calendar?${params}`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load project calendar.");
  return response.json();
}

export async function getDashboard(workspaceId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/dashboard/${workspaceId}`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load dashboard.");
  return response.json();
}

export async function getProjectTasks(projectId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/tasks`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load project tasks.");
  return response.json();
}

export async function createTask(projectId, payload) {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { ...basicHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to create task.");
  return data;
}

export async function updateTask(taskId, payload) {
  const response = await fetch(`${apiBaseUrl}/api/v1/tasks/${taskId}`, {
    method: "PUT",
    headers: { ...basicHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to update task.");
  return data;
}

export async function getTask(taskId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/tasks/${taskId}`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load task.");
  return response.json();
}

export async function getTaskDetail(taskId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/tasks/${taskId}/detail`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load task details.");
  return response.json();
}

export async function bulkDeleteTasks(taskIds) {
  const response = await fetch(`${apiBaseUrl}/api/v1/tasks/delete`, {
    method: "POST",
    headers: { ...basicHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ taskIds }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to delete tasks.");
  return data;
}

export async function getMyTasks(workspaceId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/tasks/my-tasks?workspaceId=${encodeURIComponent(workspaceId)}`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load your tasks.");
  return response.json();
}

export async function addTaskComment(taskId, content) {
  const response = await fetch(`${apiBaseUrl}/api/v1/comments`, {
    method: "POST",
    headers: { ...basicHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ taskId, content }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to add comment.");
  return data;
}

export async function getTaskComments(taskId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/comments/${taskId}`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load comments.");
  return response.json();
}

export async function getTodos() {
  const response = await fetch(`${apiBaseUrl}/api/v1/todos`);
  if (!response.ok) throw new Error("Unable to load todos.");
  return response.json();
}

export async function createTodo(payload) {
  const response = await fetch(`${apiBaseUrl}/api/v1/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to create todo.");
  return data;
}

export async function updateTodo(todoId, payload) {
  const response = await fetch(`${apiBaseUrl}/api/v1/todos/${todoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to update todo.");
  return data;
}

export async function deleteTodo(todoId) {
  const response = await fetch(`${apiBaseUrl}/api/v1/todos/${todoId}`, { method: "DELETE" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Unable to delete todo.");
  }
  return response.json();
}
