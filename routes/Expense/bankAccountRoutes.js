const express = require("express");
const route = require("express").Router();
const bankAccountController = require("../../controller/Expense/bankAccount.controller");
const middleware = require("../../middleware/authmiddleware");

route.post(
  "/",
  middleware.verifyAccessToken,
  bankAccountController.createBankAccount,
);

route.get(
  "/",
  middleware.verifyAccessToken,
  bankAccountController.getBankAccounts,
);

route.get(
  "/:id",
  middleware.verifyAccessToken,
  bankAccountController.getBankAccountByIdd,
);

route.put(
  "/:id",
  middleware.verifyAccessToken,
  bankAccountController.updateBankAccount,
);

route.patch(
  "/:id/disconnect",
  middleware.verifyAccessToken,
  bankAccountController.disconnectBankAccount,
);

// route.delete(
//   "/:id",
//     middleware.verifyAccessToken,
//   bankAccountController.deleteBankAccount
// );

// router.patch(
//   "/:id/sync/start",
//   bankAccountController.startBankSync
// );

// router.patch(
//   "/:id/sync/success",
//   bankAccountController.completeBankSync
// );

// router.patch(
//   "/:id/sync/failed",
//   bankAccountController.failBankSync
// );

module.exports = route;
