const workspaceRepository = require("../repositories/workspace.repository");
const projectRepository = require("../repositories/project.repository");
const { createWorkspaceSchema } = require("../schemas/workspace.schema");

const WORKSPACE_DOMAIN = process.env.WORKSPACE_DOMAIN || "kairos.app";

function makeSlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function enrichWorkspace(workspace, userId) {
  const projects = await projectRepository.findByWorkspace(workspace.id);
  const activeWorkspace = await workspaceRepository.getActiveWorkspace(userId);

  return {
    ...workspace,
    projectCount: projects.length,
    memberCount: workspace.members.length,
    workspaceUrl: `${workspace.slug}.${WORKSPACE_DOMAIN}`,
    isActive: activeWorkspace?.id === workspace.id,
  };
}

async function listForUser(userId) {
  const workspaces = await workspaceRepository.findByMember(userId);
  return Promise.all(workspaces.map((workspace) => enrichWorkspace(workspace, userId)));
}

function isValidSlug(slug) {
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(slug);
}

function slugAvailability(slug) {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) return { available: false, reason: "Enter a slug to check availability." };
  if (!isValidSlug(normalizedSlug)) return { available: false, reason: "Use 3–30 lowercase letters, numbers, and hyphens." };
  return workspaceRepository.findBySlug(normalizedSlug).then((existing) => {
    if (existing) return { available: false, reason: "This slug is already in use." };
    return { available: true, slug: normalizedSlug, workspaceUrl: `${normalizedSlug}.${WORKSPACE_DOMAIN}` };
  });
}

async function create(userId, payload, fallbackName = "My Workspace") {
  const parsed = createWorkspaceSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((item) => item.message).join("; ") };
  }

  const data = parsed.data;
  const availability = await slugAvailability(data.slug);
  if (!availability.available) return { error: availability.reason };

  const workspace = await workspaceRepository.create({
    name: data.name.trim(),
    slug: availability.slug,
    ownerId: userId,
    logoUrl: data.logoUrl || null,
  });

  return { workspace: await enrichWorkspace(workspace, userId) };
}

async function getSession(userId) {
  const workspaces = await listForUser(userId);
  const activeWorkspace = await workspaceRepository.getActiveWorkspace(userId);

  return {
    needsWorkspaceSetup: workspaces.length === 0,
    workspaceCount: workspaces.length,
    activeWorkspaceId: activeWorkspace?.id || null,
    workspaces,
  };
}

async function activate(userId, workspaceId) {
  const workspace = await workspaceRepository.setActiveWorkspace(userId, workspaceId);
  if (!workspace) return { error: "Workspace not found" };
  return { workspace: await enrichWorkspace(workspace, userId) };
}

async function getCurrent(userId) {
  const workspace = await workspaceRepository.getActiveWorkspace(userId);
  if (!workspace) return { error: "No active workspace" };
  return { workspace: await enrichWorkspace(workspace, userId) };
}

module.exports = {
  listForUser,
  create,
  slugAvailability,
  getSession,
  activate,
  getCurrent,
  makeSlug,
  WORKSPACE_DOMAIN,
};
