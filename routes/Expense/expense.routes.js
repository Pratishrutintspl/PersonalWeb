const express = require("express");

const route = express.Router();

const expenseController = require(
  "../../controller/Expense/expense.controller"
);

const middleware = require(
  "../../middleware/authmiddleware"
);


// ============================================
// CREATE MANUAL EXPENSE
// ============================================

route.post(
  "/",
  middleware.verifyAccessToken,
  expenseController.createExpense
);


// ============================================
// GET ALL EXPENSES
// ============================================

route.get(
  "/",
  middleware.verifyAccessToken,
  expenseController.getExpenses
);


// ============================================
// SPECIFIC GET ROUTES
// MUST BE BEFORE /:id
// ============================================

// GET EXPENSE BY DATE
route.get(
  "/by-date",
  middleware.verifyAccessToken,
  expenseController.getExpenseByDate
);


// GET EXPENSE CALENDAR COUNT
route.get(
  "/expense-calendar-count",
  middleware.verifyAccessToken,
  expenseController.getExpenseCountByDate
);


// ============================================
// GET EXPENSE BY ID
// DYNAMIC ROUTE SHOULD COME AFTER STATIC ROUTES
// ============================================

route.get(
  "/:id",
  middleware.verifyAccessToken,
  expenseController.getExpenseById
);


// ============================================
// UPDATE EXPENSE
// ============================================

route.put(
  "/:id",
  middleware.verifyAccessToken,
  expenseController.updateExpense
);


// ============================================
// DELETE EXPENSE
// ============================================

route.delete(
  "/:id",
  middleware.verifyAccessToken,
  expenseController.deleteExpense
);


module.exports = route;