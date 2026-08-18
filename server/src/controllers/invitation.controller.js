const invitationService = require("../services/invitation.service");

function currentUser(req) {
  if (req.basicUser) {
    return {
      id: req.basicUser.id,
      name: req.basicUser.name,
      email: req.basicUser.email,
    };
  }

  const auth = require("@clerk/express").getAuth(req);
  return {
    id: auth.userId,
    name: auth.username || "User",
    email: auth.email || "",
  };
}

function invite(req, res) {
  const user = currentUser(req);
  const { workspaceId, inviteeEmail } = req.body;

  if (!workspaceId || !inviteeEmail) {
    return res.status(400).json({ error: "workspaceId and inviteeEmail are required" });
  }

  const result = invitationService.inviteUser(workspaceId, inviteeEmail, user.id);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(201).json(result.invitation);
}

function accept(req, res) {
  const user = currentUser(req);
  const { invitationId } = req.params;

  if (!invitationId) {
    return res.status(400).json({ error: "invitationId is required" });
  }

  const result = invitationService.acceptInvitation(invitationId, user.id, user.email, user.name);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.json(result);
}

function getPending(req, res) {
  const user = currentUser(req);
  const invitations = invitationService.getPendingInvitations(user.email);
  return res.json(invitations);
}

function listWorkspaceInvitations(req, res) {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }

  const invitations = invitationService.getWorkspaceInvitations(workspaceId);
  return res.json(invitations);
}

module.exports = { invite, accept, getPending, listWorkspaceInvitations };
