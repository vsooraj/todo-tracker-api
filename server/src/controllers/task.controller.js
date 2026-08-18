const taskService = require("../services/task.service");
const { currentUser } = require("../utils/user.helper");

async function listByProject(req, res) {
  const user = currentUser(req);
  const result = await taskService.listByProject(user.id, req.params.projectId);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.board);
}

async function getDetail(req, res) {
  const user = currentUser(req);
  const result = await taskService.getDetail(user.id, req.params.taskId);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.detail);
}

async function getById(req, res) {
  const user = currentUser(req);
  const result = await taskService.getById(user.id, req.params.taskId);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.task);
}

async function create(req, res) {
  const user = currentUser(req);
  const result = await taskService.create(user.id, req.params.projectId, req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(201).json(result.task);
}

async function update(req, res) {
  const user = currentUser(req);
  const result = await taskService.update(user.id, req.params.taskId, req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.json(result.task);
}

async function bulkDelete(req, res) {
  const user = currentUser(req);
  const result = await taskService.bulkDelete(user.id, req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.json(result);
}

async function myTasks(req, res) {
  const user = currentUser(req);
  const { workspaceId } = req.query;
  if (!workspaceId) return res.status(400).json({ error: "workspaceId query parameter is required" });
  const result = await taskService.myTasks(user.id, workspaceId);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.json(result.tasks);
}

async function addComment(req, res) {
  const user = currentUser(req);
  const result = await taskService.addComment(user.id, req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(201).json(result.comment);
}

async function getComments(req, res) {
  const user = currentUser(req);
  const result = await taskService.getComments(user.id, req.params.taskId);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.comments);
}

module.exports = {
  listByProject,
  getDetail,
  getById,
  create,
  update,
  bulkDelete,
  myTasks,
  addComment,
  getComments,
};
