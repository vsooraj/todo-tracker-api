const express = require("express");
const { requireAuth } = require("@clerk/express");
const invitationController = require("../controllers/invitation.controller");
const { requireBasicAuth } = require("../middleware/basic-auth.middleware");

const router = express.Router();
const requireApplicationAuth = process.env.CLERK_SECRET_KEY ? requireAuth() : requireBasicAuth;

router.use(requireApplicationAuth);

// Invite a user to a workspace
router.post("/", invitationController.invite);

// Accept an invitation
router.post("/:invitationId/accept", invitationController.accept);

// Get pending invitations for current user
router.get("/pending", invitationController.getPending);

// List invitations for a workspace
router.get("/workspace/:workspaceId", invitationController.listWorkspaceInvitations);

module.exports = router;
