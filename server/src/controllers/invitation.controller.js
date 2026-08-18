const invitationService = require("../services/invitation.service");
const { currentUser } = require("../utils/user.helper");

async function invite(req, res) {
  const user = currentUser(req);
  const { workspaceId, inviteeEmail } = req.body;

  if (!workspaceId || !inviteeEmail) {
    return res.status(400).json({ error: "workspaceId and inviteeEmail are required" });
  }

  const result = await invitationService.inviteUser(workspaceId, inviteeEmail, user.id);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(201).json(result.invitation);
}

async function accept(req, res) {
  const user = currentUser(req);
  const { invitationId } = req.params;

  if (!invitationId) {
    return res.status(400).json({ error: "invitationId is required" });
  }

  const result = await invitationService.acceptInvitation(invitationId, user.id, user.email, user.name);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.json(result);
}

async function getPending(req, res) {
  const user = currentUser(req);
  const invitations = await invitationService.getPendingInvitations(user.email);
  return res.json(invitations);
}

async function listWorkspaceInvitations(req, res) {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }

  const invitations = await invitationService.getWorkspaceInvitations(workspaceId);
  return res.json(invitations);
}

module.exports = { invite, accept, getPending, listWorkspaceInvitations };
