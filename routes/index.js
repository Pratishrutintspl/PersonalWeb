const route = require("express").Router()
const authRouter   = require("./authRoute")
const activityRoute = require("./activityRoute")
const todoRoute = require("./todoRoute")
const dailyInfoRoute = require("./dailyInfoRoute")
const expenseRoute = require("../routes/expenseCategoryRoute")


route.use("/auth",authRouter)
route.use("/activity",activityRoute)
route.use("/todo",todoRoute)
route.use("/dailyinfo",dailyInfoRoute)

route.use("/expense",expenseRoute)


module.exports = route