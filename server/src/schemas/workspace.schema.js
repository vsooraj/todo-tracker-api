const { z } = require("zod");

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Organisation name is required").max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/, "Use 3–30 lowercase letters, numbers, and hyphens."),
  logoUrl: z.string().optional().nullable(),
});

module.exports = { createWorkspaceSchema };
