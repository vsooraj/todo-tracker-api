const todoRepository = require("../repositories/todo.repository");

function create({ title, completed }) {
  if (!title || typeof title !== "string") {
    return { error: "title is required and must be a string" };
  }
  return { todo: todoRepository.create({ title: title.trim(), completed: Boolean(completed) }) };
}

function list() {
  return todoRepository.findAll();
}

function getById(id) {
  return todoRepository.findById(id);
}

function update(id, { title, completed }) {
  if (title !== undefined && typeof title !== "string") {
    return { error: "title must be a string" };
  }
  return { todo: todoRepository.update(id, { title, completed }) };
}

function remove(id) {
  return todoRepository.remove(id);
}

module.exports = { create, list, getById, update, remove };
