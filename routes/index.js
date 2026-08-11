const route = require("express").Router();
const authRouter = require("./authRoute");
const activityRoute = require("./activityRoute");
const todoRoute = require("./todoRoute");
const dailyInfoRoute = require("./dailyInfoRoute");
const expenseCategoryRoute = require("../routes/Expense/expenseCategoryRoute");
const expenseRoute = require("../routes/Expense/expense.routes");

const bankAccountRoutes = require("../routes/Expense/bankAccountRoutes");
const bankTransactionRoutes = require("../routes/Expense/bankTransactionRoutes");
route.use("/auth", authRouter);
route.use("/activity", activityRoute);
route.use("/todo", todoRoute);
route.use("/dailyinfo", dailyInfoRoute);

route.use("/expense-category", expenseCategoryRoute);

route.use("/api/bank-accounts", bankAccountRoutes);
route.use("/api/bank-transcation", bankTransactionRoutes);
route.use("/expense", expenseRoute);
module.exports = route;
