const express = require("express");
const { requireAuth } = require("@clerk/express");
const taskController = require("../controllers/task.controller");
const { requireBasicAuth } = require("../middleware/basic-auth.middleware");

const router = express.Router();
const requireApplicationAuth = process.env.CLERK_SECRET_KEY ? requireAuth() : requireBasicAuth;

router.use(requireApplicationAuth);
router.get("/:taskId", taskController.getComments);
router.post("/", taskController.addComment);

module.exports = router;
