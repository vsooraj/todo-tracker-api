const { getAuth } = require("@clerk/express");
const workspaceService = require("../services/workspace.service");

function currentUserId(req) {
  return req.basicUser ? req.basicUser.id : getAuth(req).userId;
}

function list(req, res) {
  res.json(workspaceService.listForUser(currentUserId(req)));
}

function create(req, res) {
  const result = workspaceService.create(currentUserId(req), req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(201).json(result.workspace);
}

function slugAvailability(req, res) {
  res.json(workspaceService.slugAvailability(req.query.slug));
}

module.exports = { list, create, slugAvailability };
