const workspaceRepository = require("../repositories/workspace.repository");

async function inviteUser(workspaceId, inviteeEmail, invitedByUserId) {
  if (!inviteeEmail || typeof inviteeEmail !== "string" || !inviteeEmail.includes("@")) {
    return { error: "Valid email address is required" };
  }

  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) {
    return { error: "Workspace not found" };
  }

  const inviter = workspace.members.find((member) => member.userId === invitedByUserId);
  if (!inviter || inviter.role !== "Admin") {
    return { error: "Only workspace admins can invite members" };
  }

  const invitation = await workspaceRepository.createInvitation({
    workspaceId,
    inviteeEmail,
    invitedByUserId,
  });

  if (!invitation) {
    return { error: "Unable to create invitation" };
  }

  return { invitation };
}

async function acceptInvitation(invitationId, userId, userEmail, userName) {
  if (!invitationId || !userId || !userEmail) {
    return { error: "Invalid invitation or user data" };
  }

  const result = await workspaceRepository.acceptInvitation(invitationId, userId, userEmail, userName);
  if (!result) {
    return { error: "Invitation not found or already accepted" };
  }

  return { workspace: result.workspace, invitation: result.invitation };
}

async function getPendingInvitations(userEmail) {
  return workspaceRepository.getInvitationsForUser(userEmail);
}

async function getWorkspaceInvitations(workspaceId) {
  return workspaceRepository.getInvitationsForWorkspace(workspaceId);
}

module.exports = {
  inviteUser,
  acceptInvitation,
  getPendingInvitations,
  getWorkspaceInvitations,
};
