const workspaceRepository = require("../repositories/workspace.repository");

function makeSlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function listForUser(userId) {
  const workspaces = workspaceRepository.findByMember(userId);
  if (workspaces.length === 0) {
    const defaultWorkspace = workspaceRepository.getActiveWorkspace(userId);
    return defaultWorkspace ? [defaultWorkspace] : [];
  }
  return workspaces;
}

function isValidSlug(slug) {
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(slug);
}

function slugAvailability(slug) {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!isValidSlug(normalizedSlug)) return { available: false, reason: "Use 3–30 lowercase letters, numbers, and hyphens." };
  if (workspaceRepository.findBySlug(normalizedSlug)) return { available: false, reason: "This slug is already in use." };
  return { available: true, slug: normalizedSlug };
}

function create(userId, { name, slug }, fallbackName = "My Workspace") {
  if (!name || typeof name !== "string" || !name.trim()) {
    return { error: "workspace name is required" };
  }

  const trimmedName = name.trim();
  if (trimmedName.length > 100) return { error: "workspace name must be 100 characters or fewer" };
  const resolvedSlug = slug ? String(slug).trim().toLowerCase() : makeSlug(trimmedName || fallbackName);
  const availability = slugAvailability(resolvedSlug);
  if (!availability.available) return { error: availability.reason };
  return { workspace: workspaceRepository.create({ name: trimmedName, slug: availability.slug, ownerId: userId }) };
}

function ensureDefaultWorkspace(user) {
  const userId = user && user.id ? user.id : user;
  const current = listForUser(userId);
  if (current.length > 0) return { workspace: workspaceRepository.getActiveWorkspace(userId) || current[0] };

  const defaultName = user && user.name ? `${user.name}'s Workspace` : "My Workspace";
  return create(userId, { name: defaultName, slug: makeSlug(defaultName) });
}

function activate(userId, workspaceId) {
  const workspace = workspaceRepository.setActiveWorkspace(userId, workspaceId);
  if (!workspace) return { error: "workspace not found" };
  return { workspace };
}

module.exports = { listForUser, create, slugAvailability, ensureDefaultWorkspace, activate };
