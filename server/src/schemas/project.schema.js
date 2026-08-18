const { z } = require("zod");

const projectStatus = z.enum(["Planning", "Active", "Completed"]);
const projectPriority = z.enum(["Low", "Medium", "High"]);

const createProjectSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
  name: z.string().trim().min(1, "name is required").max(120),
  description: z.string().trim().max(2000).optional().default(""),
  status: projectStatus.optional().default("Planning"),
  priority: projectPriority.optional().default("Medium"),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  projectLeadId: z.string().min(1).optional(),
  teamMemberIds: z.array(z.string().min(1)).optional().default([]),
});

const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  status: projectStatus.optional(),
  priority: projectPriority.optional(),
  progress: z.number().int().min(0).max(100).optional(),
  projectLeadId: z.string().min(1).optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  archived: z.boolean().optional(),
});

const addProjectMemberSchema = z.object({
  userId: z.string().min(1, "userId is required"),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  projectStatus,
  projectPriority,
};
