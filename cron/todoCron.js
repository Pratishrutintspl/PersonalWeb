const cron = require("node-cron");
const { checkDelayedTasks } = require("../services/todoReminderService");
const { autoCreateDailyTodos } = require("../services/todoReminderService");

const startDelayedTaskCron = () => {
  cron.schedule(
    "* * * * *",
    async () => {
      console.log("=================================");
      console.log("Running Delayed Task Cron...");
      console.log(new Date());

      try {
        const delayedTasks = await checkDelayedTasks();

        console.log(
          `Delayed Task Cron Completed. Tasks Found: ${delayedTasks.length}`,
        );
      } catch (error) {
        console.error("Delayed Task Cron Error:", error.message);
      }

      console.log("=================================");
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  // console.log("✅ Delayed Task Cron Started");
};

const startAutoTodoCron = () => {
  cron.schedule(
    "* * * * *",
    async () => {
      // console.log("=================================");
      // console.log("Running Auto Daily Todo Cron...");
      // console.log(new Date());

      try {
        await autoCreateDailyTodos();

        // console.log("✅ Auto Daily Todo Completed");
      } catch (error) {
        console.error("Auto Daily Todo Cron Error:", error.message);
      }

      console.log("=================================");
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  console.log("✅ Auto Daily Todo Cron Started (12:00 AM IST)");
};

module.exports = { startDelayedTaskCron, startAutoTodoCron };
