const workspaceService = require("../services/workspace.service");
const { currentUser } = require("../utils/user.helper");

async function list(req, res) {
  const user = currentUser(req);
  const workspaces = await workspaceService.listForUser(user.id);
  return res.json(workspaces);
}

async function create(req, res) {
  const user = currentUser(req);
  const result = await workspaceService.create(user.id, req.body, `${user.name || "My"} Workspace`);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(201).json(result.workspace);
}

async function activate(req, res) {
  const user = currentUser(req);
  const result = await workspaceService.activate(user.id, req.params.workspaceId);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.workspace);
}

async function slugAvailability(req, res) {
  const result = await workspaceService.slugAvailability(req.query.slug);
  res.json(result);
}

async function getCurrent(req, res) {
  const user = currentUser(req);
  const result = await workspaceService.getCurrent(user.id);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.workspace);
}

module.exports = { list, create, activate, slugAvailability, getCurrent };
