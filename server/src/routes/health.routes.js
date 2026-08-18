const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World!");
});

router.get("/health", (req, res) => {
  res.json({ status: "ok", authentication: "clerk" });
});

module.exports = router;
