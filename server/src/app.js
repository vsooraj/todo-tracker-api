require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { configureAuthentication } = require("./middleware/auth.middleware");
const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/health.routes");
const todoRoutes = require("./routes/todo.routes");
const workspaceRoutes = require("./routes/workspace.routes");
const invitationRoutes = require("./routes/invitation.routes");

const app = express();
const allowedOrigins = new Set([
  ...(process.env.CLIENT_ORIGIN || "http://localhost:5173").split(","),
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  "http://localhost:5179",
  "http://127.0.0.1:5174",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS."));
    },
  })
);
configureAuthentication(app);
app.use(express.json());

app.use("/", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1/invitations", invitationRoutes);

// `/todos` is maintained as a compatible legacy route. New clients use `/api/v1/todos`.
app.use("/todos", todoRoutes);
app.use("/api/v1/todos", todoRoutes);

module.exports = app;
