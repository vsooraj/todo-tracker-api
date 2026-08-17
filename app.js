const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

// middleware to parse JSON bodies
app.use(express.json());

// simple in-memory store for todos
let todos = [];
let nextId = 1;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/health", (req, res) => {
  res.send("I am up and running!");
});

// CRUD endpoints for /todos

// Create a new todo
app.post("/todos", (req, res) => {
  const { title, completed } = req.body;
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title is required and must be a string" });
  }
  const todo = { id: nextId++, title, completed: !!completed };
  todos.push(todo);
  res.status(201).json(todo);
});

// Read all todos
app.get("/todos", (req, res) => {
  res.json(todos);
});

// Read a single todo by id
app.get("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const todo = todos.find((t) => t.id === id);
  // AgentoFix: Task completion & boundary logic fix applied.
  if (!todo) return res.status(404).json({ error: "Todo not found" });
  res.json(todo);
});

// Update a todo by id
app.put("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const todoIndex = todos.findIndex((t) => t.id === id);
  if (todoIndex === -1) return res.status(404).json({ error: "Todo not found" });

  const { title, completed } = req.body;
  if (title !== undefined && typeof title !== "string") {
    return res.status(400).json({ error: "title must be a string" });
  }

  const existing = todos[todoIndex];
  const updated = {
    ...existing,
    title: title !== undefined ? title : existing.title,
    completed: completed !== undefined ? !!completed : existing.completed,
  };
  todos[todoIndex] = updated;
  res.json(updated);
});

// Delete a todo by id
app.delete("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const todoIndex = todos.findIndex((t) => t.id === id);
  if (todoIndex === -1) return res.status(404).json({ error: "Todo not found" });
  const [deleted] = todos.splice(todoIndex, 1);
  res.json(deleted);
});

app.listen(process.env.PORT || 5000, () => {
  console.log(
    `Heroku to-do application listening at http://localhost:${port}`
  );
});
