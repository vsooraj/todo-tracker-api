const express = require("express");
const { requireAuth } = require("@clerk/express");
const taskController = require("../controllers/task.controller");
const { requireBasicAuth } = require("../middleware/basic-auth.middleware");

const router = express.Router();
const requireApplicationAuth = process.env.CLERK_SECRET_KEY ? requireAuth() : requireBasicAuth;

router.use(requireApplicationAuth);
router.get("/my-tasks", taskController.myTasks);
router.post("/delete", taskController.bulkDelete);
router.get("/:taskId/detail", taskController.getDetail);
router.get("/:taskId", taskController.getById);
router.put("/:taskId", taskController.update);

module.exports = router;
