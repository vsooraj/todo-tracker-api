const workspaceRepository = require("../repositories/workspace.repository");

function inviteUser(workspaceId, inviteeEmail, invitedByUserId) {
  if (!inviteeEmail || typeof inviteeEmail !== "string" || !inviteeEmail.includes("@")) {
    return { error: "Valid email address is required" };
  }

  const workspace = workspaceRepository.findById(workspaceId);
  if (!workspace) {
    return { error: "Workspace not found" };
  }

  // Only workspace admins can invite
  const inviter = workspace.members.find((m) => m.userId === invitedByUserId);
  if (!inviter || inviter.role !== "Admin") {
    return { error: "Only workspace admins can invite members" };
  }

  const invitation = workspaceRepository.createInvitation({
    workspaceId,
    inviteeEmail,
    invitedByUserId,
  });

  if (!invitation) {
    return { error: "Unable to create invitation" };
  }

  return { invitation };
}

function acceptInvitation(invitationId, userId, userEmail, userName) {
  if (!invitationId || !userId || !userEmail) {
    return { error: "Invalid invitation or user data" };
  }

  const result = workspaceRepository.acceptInvitation(invitationId, userId, userEmail, userName);
  if (!result) {
    return { error: "Invitation not found or already accepted" };
  }

  return { workspace: result.workspace, invitation: result.invitation };
}

function getPendingInvitations(userEmail) {
  return workspaceRepository.getInvitationsForUser(userEmail);
}

function getWorkspaceInvitations(workspaceId) {
  return workspaceRepository.getInvitationsForWorkspace(workspaceId);
}

module.exports = {
  inviteUser,
  acceptInvitation,
  getPendingInvitations,
  getWorkspaceInvitations,
};
