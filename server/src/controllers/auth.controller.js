const workspaceService = require("../services/workspace.service");

async function getCurrentUser(req, res) {
  if (req.basicUser) {
    const session = await workspaceService.getSession(req.basicUser.id);
    return res.json({
      ...req.basicUser,
      needsWorkspaceSetup: session.needsWorkspaceSetup,
      workspaceCount: session.workspaceCount,
      activeWorkspaceId: session.activeWorkspaceId,
    });
  }
  const { getAuth } = require("@clerk/express");
  const { userId, orgId, orgRole, sessionId } = getAuth(req);
  res.json({ userId, orgId, orgRole, sessionId });
}

async function login(req, res) {
  const session = await workspaceService.getSession(req.basicUser.id);
  res.json({
    ...req.basicUser,
    needsWorkspaceSetup: session.needsWorkspaceSetup,
    workspaceCount: session.workspaceCount,
    activeWorkspaceId: session.activeWorkspaceId,
  });
}

module.exports = { getCurrentUser, login };
