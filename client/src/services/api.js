const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function loginWithBasicCredentials(email, password) {
  const authorization = `Basic ${btoa(`${email}:${password}`)}`;
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: authorization },
  });
  if (!response.ok) throw new Error("Email or password is incorrect.");
  sessionStorage.setItem("basic-authorization", authorization);
  return response.json();
}

function basicHeaders() {
  return { Authorization: sessionStorage.getItem("basic-authorization") || "" };
}

export async function getWorkspaces() {
  const response = await fetch(`${apiBaseUrl}/api/v1/workspaces`, { headers: basicHeaders() });
  if (!response.ok) throw new Error("Unable to load workspaces.");
  return response.json();
}

export async function createWorkspace(name, slug) {
  const response = await fetch(`${apiBaseUrl}/api/v1/workspaces`, {
    method: "POST",
    headers: { ...basicHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ name, slug }),
  });
  if (!response.ok) throw new Error("Unable to create the workspace.");
  return response.json();
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
