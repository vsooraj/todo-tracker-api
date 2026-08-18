const projectService = require("../services/project.service");
const { currentUser } = require("../utils/user.helper");

async function create(req, res) {
  const user = currentUser(req);
  const result = await projectService.create(user.id, req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(201).json(result.project);
}

async function list(req, res) {
  const user = currentUser(req);
  const { workspaceId } = req.query;
  if (!workspaceId) return res.status(400).json({ error: "workspaceId query parameter is required" });

  const result = await projectService.list(user.id, workspaceId);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.json(result.projects);
}

async function getById(req, res) {
  const user = currentUser(req);
  const result = await projectService.getById(user.id, req.params.projectId);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.project);
}

async function update(req, res) {
  const user = currentUser(req);
  const result = await projectService.update(user.id, req.params.projectId, req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.json(result.project);
}

async function addMember(req, res) {
  const user = currentUser(req);
  const result = await projectService.addMember(user.id, req.params.projectId, req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(201).json({ member: result.member, project: result.project });
}

async function analytics(req, res) {
  const user = currentUser(req);
  const result = await projectService.getAnalytics(user.id, req.params.projectId);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.analytics);
}

async function calendar(req, res) {
  const user = currentUser(req);
  const { year, month } = req.query;
  const result = await projectService.getCalendar(user.id, req.params.projectId, year, month);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.calendar);
}

module.exports = {
  create,
  list,
  getById,
  update,
  addMember,
  analytics,
  calendar,
};
