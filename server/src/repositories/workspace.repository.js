// Temporary repository. Replace with PostgreSQL-backed workspace and membership tables.
let workspaces = [];
let nextId = 1;

function create({ name, slug, ownerId }) {
  const workspace = {
    id: `workspace-${nextId++}`,
    name,
    slug: `${slug || "workspace"}-${nextId - 1}`,
    ownerId,
    members: [{ userId: ownerId, role: "Admin" }],
    createdAt: new Date().toISOString(),
  };
  workspaces.push(workspace);
  return workspace;
}

function findByMember(userId) {
  return workspaces.filter((workspace) => workspace.members.some((member) => member.userId === userId));
}

function findBySlug(slug) {
  return workspaces.find((workspace) => workspace.slug === slug);
}

module.exports = { create, findByMember, findBySlug };
