const { z } = require("zod");

const addCommentSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().trim().min(1, "Comment content is required").max(5000),
});

const bulkDeleteSchema = z.object({
  taskIds: z.array(z.string().min(1)).min(1, "Select at least one task"),
});

module.exports = { addCommentSchema, bulkDeleteSchema };
