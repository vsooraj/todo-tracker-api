const { z } = require("zod");

const taskStatus = z.enum(["To Do", "In Progress", "In Review", "Done"]);
const taskPriority = z.enum(["Low", "Medium", "High"]);
const taskType = z.enum(["Task", "Bug", "Feature", "Improvement"]);

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().default(""),
  type: taskType.optional().default("Task"),
  priority: taskPriority.optional().default("Medium"),
  assigneeId: z.string().optional().nullable(),
  status: taskStatus.optional().default("To Do"),
  dueDate: z.string().optional().nullable(),
  sprint: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  estimatedEffortHours: z.number().min(0).optional(),
  collaborators: z.array(z.string()).optional().default([]),
  category: z.string().optional().nullable(),
  impact: z.string().optional().nullable(),
  risk: z.string().optional().nullable(),
  environment: z.string().optional().nullable(),
  relatedEpic: z.string().optional().nullable(),
  dependsOn: z.array(z.string()).optional().default([]),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  type: taskType.optional(),
  priority: taskPriority.optional(),
  assigneeId: z.string().optional().nullable(),
  status: taskStatus.optional(),
  progress: z.number().int().min(0).max(100).optional(),
  dueDate: z.string().optional().nullable(),
  sprint: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  subtasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    assigneeId: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    status: z.string().optional(),
  })).optional(),
  estimatedEffortHours: z.number().min(0).optional(),
  timeLoggedMinutes: z.number().min(0).optional(),
  collaborators: z.array(z.string()).optional(),
  category: z.string().optional().nullable(),
  impact: z.string().optional().nullable(),
  risk: z.string().optional().nullable(),
  environment: z.string().optional().nullable(),
  relatedEpic: z.string().optional().nullable(),
  dependsOn: z.array(z.string()).optional(),
  blocks: z.array(z.string()).optional(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskStatus,
  taskPriority,
  taskType,
};
