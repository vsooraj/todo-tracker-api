const todoRepository = require("../repositories/todo.repository");

async function create({ title, completed }) {
  if (!title || typeof title !== "string") {
    return { error: "title is required and must be a string" };
  }
  return { todo: await todoRepository.create({ title: title.trim(), completed: Boolean(completed) }) };
}

async function list(filter) {
  const todos = await todoRepository.findAll();
  if (filter === 'active') {
    return todos.filter(todo => !todo.completed);
  } else if (filter === 'done') {
    return todos.filter(todo => todo.completed);
  }
  return todos;
}

async function getById(id) {
  const todo = await todoRepository.findById(id);
  if (!todo) {
    return { error: "Todo not found" };
  }
  return { todo };
}

async function update(id, { title, completed }) {
  if (title !== undefined && typeof title !== "string") {
    return { error: "title must be a string" };
  }
  const updatedTodo = await todoRepository.update(id, { title, completed });
  if (!updatedTodo) {
    return { error: "Todo not found or update failed" };
  }
  return { todo: updatedTodo };
}

async function remove(id) {
  const todo = await todoRepository.remove(id);
  if (!todo) {
    return { error: "Todo not found" };
  }
  return { todo };
}

module.exports = { create, list, getById, update, remove };