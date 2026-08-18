// Temporary repository. Replace with PostgreSQL-backed workspace and membership tables.
let workspaces = [];
let invitations = [];
let nextId = 1;
let nextInvitationId = 1;
const activeWorkspaceByUser = new Map();

function create({ name, slug, ownerId }) {
  const resolvedSlug = slug || `workspace-${nextId}`;
  const workspace = {
    id: `workspace-${nextId++}`,
    name,
    slug: resolvedSlug,
    ownerId,
    members: [{ userId: ownerId, role: "Admin" }],
    createdAt: new Date().toISOString(),
  };
  workspaces.push(workspace);
  activeWorkspaceByUser.set(ownerId, workspace.id);
  return workspace;
}

function findByMember(userId) {
  return workspaces
    .filter((workspace) => workspace.members.some((member) => member.userId === userId))
    .sort((left, right) => {
      const leftPriority = activeWorkspaceByUser.get(userId) === left.id ? 0 : 1;
      const rightPriority = activeWorkspaceByUser.get(userId) === right.id ? 0 : 1;
      return leftPriority - rightPriority;
    });
}

function findBySlug(slug) {
  return workspaces.find((workspace) => workspace.slug === slug);
}

function getActiveWorkspace(userId) {
  const activeId = activeWorkspaceByUser.get(userId);
  if (!activeId) {
    const first = findByMember(userId)[0];
    if (first) {
      activeWorkspaceByUser.set(userId, first.id);
    }
    return first || null;
  }

  return workspaces.find((workspace) => workspace.id === activeId && workspace.members.some((member) => member.userId === userId)) || null;
}

function setActiveWorkspace(userId, workspaceId) {
  const workspace = workspaces.find((item) => item.id === workspaceId && item.members.some((member) => member.userId === userId));
  if (!workspace) return null;
  activeWorkspaceByUser.set(userId, workspaceId);
  return workspace;
}

function findById(workspaceId) {
  return workspaces.find((workspace) => workspace.id === workspaceId) || null;
}

function createInvitation({ workspaceId, inviteeEmail, invitedByUserId }) {
  const workspace = findById(workspaceId);
  if (!workspace) return null;

  // Prevent duplicate invitations
  const existing = invitations.find(
    (inv) => inv.workspaceId === workspaceId && inv.inviteeEmail === inviteeEmail && inv.status === "pending"
  );
  if (existing) return existing;

  const invitation = {
    id: `invite-${nextInvitationId++}`,
    workspaceId,
    inviteeEmail,
    invitedByUserId,
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  };
  invitations.push(invitation);
  return invitation;
}

function acceptInvitation(invitationId, userId, userEmail, userName) {
  const invitation = invitations.find((inv) => inv.id === invitationId);
  if (!invitation || invitation.status !== "pending") return null;
  if (invitation.inviteeEmail !== userEmail) return null;

  const workspace = findById(invitation.workspaceId);
  if (!workspace) return null;

  // Add user to workspace members
  if (!workspace.members.some((member) => member.userId === userId)) {
    workspace.members.push({ userId, role: "Member", email: userEmail, name: userName });
  }

  // Mark invitation as accepted
  invitation.status = "accepted";
  invitation.acceptedAt = new Date().toISOString();

  return { workspace, invitation };
}

function getInvitationsForWorkspace(workspaceId) {
  return invitations.filter((inv) => inv.workspaceId === workspaceId);
}

function getInvitationsForUser(userEmail) {
  return invitations.filter((inv) => inv.inviteeEmail === userEmail && inv.status === "pending");
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
