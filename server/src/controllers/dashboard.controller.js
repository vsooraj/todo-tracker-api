const dashboardService = require("../services/dashboard.service");
const { currentUser } = require("../utils/user.helper");

async function getDashboard(req, res) {
  const user = currentUser(req);
  const result = await dashboardService.getDashboard(user.id, req.params.workspaceId);
  if (result.error) return res.status(404).json({ error: result.error });
  return res.json(result.dashboard);
}

module.exports = { getDashboard };
