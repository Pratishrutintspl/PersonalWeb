// const dns = require("dns");
// dns.setDefaultResultOrder("ipv4first");
// require("dotenv").config();
// const app = require("./app");
// const connectDB = require("./config/dbConnection");
// const PORT = process.env.PORT || 8000;
const { startAutoTodoCron, startDelayedTaskCron } = require("./cron/todoCron");
// connectDB();
// const passport = require("passport");

// require("./config/passport");

// app.use(
// passport.initialize()
// );

// app.use(
// "/auth",
// require("./routes/googleAuthRoutes")
// );
// app.get("/", (req, res) => {
//   res.send("Expense tracker running");
// });

// app.listen(PORT, () => {
//   console.log(`server running on port ${PORT}`);
//   startAutoTodoCron();
//   startDelayedTaskCron();
// });
require("dotenv").config();

const passport = require("passport");

require("./config/passport");

const app = require("./app");

app.use(passport.initialize());

const connectDB = require("./config/dbConnection");

connectDB();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
  startAutoTodoCron();
  startDelayedTaskCron();
});
