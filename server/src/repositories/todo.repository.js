// Temporary development repository. Replace this module with PostgreSQL queries
// while keeping the service and controller contracts unchanged.
let todos = [];
let nextId = 1;

function create({ title, completed }) {
  const todo = { id: nextId++, title, completed };
  todos.push(todo);
  return todo;
}

function findAll() {
  return todos;
}

function findById(id) {
  return todos.find((todo) => todo.id === Number.parseInt(id, 10));
}

function update(id, { title, completed }) {
  const todo = findById(id);
  if (!todo) return null;
  if (title !== undefined) todo.title = title;
  if (completed !== undefined) todo.completed = Boolean(completed);
  return todo;
}

function remove(id) {
  const index = todos.findIndex((todo) => todo.id === Number.parseInt(id, 10));
  if (index === -1) return null;
  return todos.splice(index, 1)[0];
}

module.exports = { create, findAll, findById, update, remove };
