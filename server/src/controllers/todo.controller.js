const todoService = require("../services/todo.service");

async function create(req, res) {
  const result = await todoService.create(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(201).json(result.todo);
}

async function list(req, res) {
  const todos = await todoService.list(req.query.filter);
  res.json(todos);
}

async function getById(req, res) {
  const result = await todoService.getById(req.params.id);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.todo);
}

async function update(req, res) {
  const result = await todoService.update(req.params.id, req.body);
  if (result.error) {
    const status = result.error.toLowerCase().includes("not found") ? 404 : 400;
    return res.status(status).json({ error: result.error });
  }
  return res.json(result.todo);
}

async function remove(req, res) {
  const result = await todoService.remove(req.params.id);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.todo);
}

module.exports = { create, list, getById, update, remove };
