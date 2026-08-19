const todoService = require("../services/todo.service");

function create(req, res) {
  const result = todoService.create(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(201).json(result.todo);
}

function list(req, res) {
  const filter = req.query.filter;
  let todos = todoService.list();

  if (filter === 'active') {
    todos = todos.filter(todo => !todo.completed);
  } else if (filter === 'done') {
    todos = todos.filter(todo => todo.completed);
  }

  res.json(todos);
}

function getById(req, res) {
  const todo = todoService.getById(req.params.id);
  if (!todo) return res.status(404).json({ error: "Todo not found" });
  return res.json(todo);
}

function update(req, res) {
  const result = todoService.update(req.params.id, req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  if (!result.todo) return res.status(404).json({ error: "Todo not found" });
  return res.json(result.todo);
}

function remove(req, res) {
  const todo = todoService.remove(req.params.id);
  if (!todo) return res.status(404).json({ error: "Todo not found" });
  return res.json(todo);
}

module.exports = { create, list, getById, update, remove };