const express = require("express");
const { requireAuth } = require("@clerk/express");
const workspaceController = require("../controllers/workspace.controller");
const { requireBasicAuth } = require("../middleware/basic-auth.middleware");

const router = express.Router();
const requireApplicationAuth = process.env.CLERK_SECRET_KEY ? requireAuth() : requireBasicAuth;

router.use(requireApplicationAuth);
router.get("/slug-availability", workspaceController.slugAvailability);
router.get("/current", workspaceController.getCurrent);
router.post("/:workspaceId/activate", workspaceController.activate);
router.get("/", workspaceController.list);
router.post("/", workspaceController.create);

module.exports = router;
