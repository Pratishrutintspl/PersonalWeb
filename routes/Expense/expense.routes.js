const express = require("express");

const route = express.Router();

const expenseController = require(
  "../../controller/Expense/expense.controller"
);

const middleware = require(
  "../../middleware/authmiddleware"
);

/*
 * Create manual expense
 */
route.post(
  "/",
  middleware.verifyAccessToken,
  expenseController.createExpense
);

/*
 * Get all expenses
 */
route.get(
  "/",
  middleware.verifyAccessToken,
  expenseController.getExpenses
);

/*
 * Get one expense
 */
// route.get(
//   "/:id",
//   middleware.verifyAccessToken,
//   expenseController.getExpenseById
// );

/*
 * Update manual expense
 */
route.put(
  "/:id",
  middleware.verifyAccessToken,
  expenseController.updateExpense
);

/*
 * Soft delete manual expense
 */
route.delete(
  "/:id",
  middleware.verifyAccessToken,
  expenseController.deleteExpense
);

module.exports = route;