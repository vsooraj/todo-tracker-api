const { getAuth } = require("@clerk/express");

function getCurrentUser(req, res) {
  if (req.basicUser) return res.json(req.basicUser);
  const { userId, orgId, orgRole, sessionId } = getAuth(req);
  res.json({ userId, orgId, orgRole, sessionId });
}

function login(req, res) {
  res.json(req.basicUser);
}

module.exports = { getCurrentUser, login };
