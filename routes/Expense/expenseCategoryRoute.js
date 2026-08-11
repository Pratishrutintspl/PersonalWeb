const expenseController = require("../../controller/Expense/expenseCategoryController");
const middleware = require("../../middleware/authmiddleware");
const route = require("express").Router();

route.post(
  "/addCategory",
  middleware.verifyAccessToken,
  expenseController.createCategory,
);
route.get(
  "/allCategory",
  middleware.verifyAccessToken,
  expenseController.categoryList,
);
route.get(
  "/category/:id",
  middleware.verifyAccessToken,
  expenseController.categoryById,
);
route.put(
  "/category/:id",
  middleware.verifyAccessToken,
  expenseController.updateCategory,
);


module.exports = route
