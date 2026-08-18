const express = require("express");
const { requireAuth } = require("@clerk/express");
const dashboardController = require("../controllers/dashboard.controller");
const { requireBasicAuth } = require("../middleware/basic-auth.middleware");

const router = express.Router();
const requireApplicationAuth = process.env.CLERK_SECRET_KEY ? requireAuth() : requireBasicAuth;

router.use(requireApplicationAuth);
router.get("/:workspaceId", dashboardController.getDashboard);

module.exports = router;
