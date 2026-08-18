const express = require("express");
const { requireAuth } = require("@clerk/express");
const projectController = require("../controllers/project.controller");
const taskController = require("../controllers/task.controller");
const { requireBasicAuth } = require("../middleware/basic-auth.middleware");

const router = express.Router();
const requireApplicationAuth = process.env.CLERK_SECRET_KEY ? requireAuth() : requireBasicAuth;

router.use(requireApplicationAuth);
router.post("/", projectController.create);
router.get("/", projectController.list);
router.get("/:projectId/analytics", projectController.analytics);
router.get("/:projectId/calendar", projectController.calendar);
router.get("/:projectId/tasks", taskController.listByProject);
router.post("/:projectId/tasks", taskController.create);
router.post("/:projectId/add-member", projectController.addMember);
router.get("/:projectId", projectController.getById);
router.put("/:projectId", projectController.update);

module.exports = router;
