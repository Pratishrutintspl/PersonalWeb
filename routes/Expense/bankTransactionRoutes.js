const express = require("express");
const route = require("express").Router();

const bankTransactionController =
  require("../../controller/Expense/bankTransaction.controller");

const middleware = require("../../middleware/authmiddleware");


route.get(
  "/",
  middleware.verifyAccessToken,
  bankTransactionController.getBankTransactions
);

route.get(
  "/:id",
  middleware.verifyAccessToken,
  bankTransactionController.getBankTransactionById
);

// route.patch(
//   "/:id/category",
//   middleware.verifyAccessToken,
//   bankTransactionController.updateTransactionCategory
// );

// route.patch(
//   "/:id/expense",
//   middleware.verifyAccessToken,
//   bankTransactionController.updateExpenseStatus
// );

// route.delete(
//   "/:id",
//   middleware.verifyAccessToken,
//   bankTransactionController.deleteBankTransaction
// );

module.exports = route;
