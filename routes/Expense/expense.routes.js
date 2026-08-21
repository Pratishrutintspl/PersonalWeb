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
); //done

/*
 * Get all expenses
 */
route.get(
  "/",
  middleware.verifyAccessToken,
  expenseController.getExpenses
); //done

route.put(
  "/:id",
  middleware.verifyAccessToken,
  expenseController.updateExpense
); //done

/*
 * Soft delete manual expense
 */
route.delete(
  "/:id",
  middleware.verifyAccessToken,
  expenseController.deleteExpense
);//done
// GET EXPENSE BY DATE
route.get(
  "/by-date",
  middleware.verifyAccessToken,
  expenseController.getExpenseByDate
);
 //done
// GET EXPENSE BY ID
route.get(
  "/:id",
  middleware.verifyAccessToken,
  expenseController.getExpenseById
); //done
module.exports = route;