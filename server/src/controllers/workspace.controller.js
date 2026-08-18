const { getAuth } = require("@clerk/express");
const workspaceService = require("../services/workspace.service");

function currentUser(req) {
  if (req.basicUser) {
    return {
      id: req.basicUser.id,
      name: req.basicUser.name,
      email: req.basicUser.email,
    };
  }

  const auth = getAuth(req);
  return {
    id: auth.userId,
    name: auth.username || "User",
    email: auth.email || "",
  };
}

function list(req, res) {
  const user = currentUser(req);
  const workspaces = workspaceService.listForUser(user.id);
  if (workspaces.length === 0) {
    const result = workspaceService.ensureDefaultWorkspace(user);
    if (result.error) return res.status(400).json({ error: result.error });
    return res.json([result.workspace]);
  }
  return res.json(workspaces);
}

function create(req, res) {
  const user = currentUser(req);
  const result = workspaceService.create(user.id, req.body, `${user.name || "My"} Workspace`);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(201).json(result.workspace);
}

function activate(req, res) {
  const user = currentUser(req);
  const result = workspaceService.activate(user.id, req.params.workspaceId);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.workspace);
}

function slugAvailability(req, res) {
  res.json(workspaceService.slugAvailability(req.query.slug));
}

module.exports = { list, create, activate, slugAvailability };
