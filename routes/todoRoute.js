const todoController = require("../controller/todoController");
const middleware = require("../middleware/authmiddleware");
const route = require("express").Router();

route.post("/create", middleware.verifyAccessToken, todoController.createTodo);
route.get("/todo-list", middleware.verifyAccessToken, todoController.todoListDate);
route.put("/:id", middleware.verifyAccessToken, todoController.updateTodo);
route.delete("/:id", middleware.verifyAccessToken, todoController.deletetodo);
route.get("/", middleware.verifyAccessToken, todoController.todoList);
route.get("/calendar-count",middleware.verifyAccessToken,todoController.getTodoCountByDate);

route.get(
  "/check-delayed-tasks/:date",
  middleware.verifyAccessToken,
  todoController.checkDelayedTasks
);

route.get(
  "/dashboard",
   middleware.verifyAccessToken,
  todoController.getDashboard
);

module.exports = route;
