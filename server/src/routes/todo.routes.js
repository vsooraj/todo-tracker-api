const express = require("express");
const todoController = require("../controllers/todo.controller");

const router = express.Router();

router.post("/", todoController.create);
router.get("/", todoController.list);
router.get("/:id", (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  todoController.getById(req, res, next);
});
router.put("/:id", todoController.update);
router.delete("/:id", todoController.remove);

module.exports = router;