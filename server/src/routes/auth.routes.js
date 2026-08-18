const express = require("express");
const { requireAuth } = require("@clerk/express");
const { getCurrentUser, login } = require("../controllers/auth.controller");
const { requireBasicAuth } = require("../middleware/basic-auth.middleware");

const router = express.Router();

router.post("/login", requireBasicAuth, login);
router.get("/me", process.env.CLERK_SECRET_KEY ? requireAuth() : requireBasicAuth, getCurrentUser);

module.exports = router;
