const Todo = require("../models/todo");
const User = require("../models/user");
const emailService = require("./emailService");
const transporter = require("../config/mailConfig");

const checkDelayedTasks = async () => {
  const now = new Date();

  // console.log("====================================");
  // console.log("UTC Time =", now);

  // console.log(
  //   "IST Time =",
  //   now.toLocaleString("en-IN", {
  //     timeZone: "Asia/Kolkata",
  //   }),
  // );
  // console.log("====================================");

  const allTodos = await Todo.find({});

  // console.log("Total Todos In DB =", allTodos.length);

  allTodos.forEach((todo) => {
    // console.log({
    //   id: todo._id,
    //   title: todo.title,
    //   status: todo.status,
    //   isDeleted: todo.isDeleted,
    //   notificationSent: todo.notificationSent,
    //   scheduledTime: todo.scheduledTime,
    //   date: todo.date,
    // });
  });

  const todos = await Todo.find({
    status: "PENDING",
    isDeleted: false,
  });

  // console.log("Pending Todos Found =", todos.length);

  const delayedTasks = [];

  for (const todo of todos) {
    // console.log("\n====================================");
    // console.log("Todo ID =", todo._id);
    // console.log("Title =", todo.title);
    // console.log("Date =", todo.date);
    // console.log("Scheduled Time =", todo.scheduledTime);

    if (!todo.scheduledTime) {
      console.log("No scheduledTime found");
      continue;
    }

    const taskDateTime = new Date(todo.date);

    const [hours, minutes] = todo.scheduledTime.split(":").map(Number);

    taskDateTime.setHours(hours);
    taskDateTime.setMinutes(minutes);
    taskDateTime.setSeconds(0);
    taskDateTime.setMilliseconds(0);

    // console.log("Task DateTime =", taskDateTime);

    // console.log(
    //   "Task DateTime IST =",
    //   taskDateTime.toLocaleString("en-IN", {
    //     timeZone: "Asia/Kolkata",
    //   }),
    // );

    // console.log("Current DateTime =", now);

    const isDelayed = taskDateTime.getTime() <= now.getTime();

    // console.log("Is Delayed =", isDelayed);

    if (isDelayed && !todo.notificationSent) {
      console.log("Delayed Task Found");
      console.log({
        isDelayed,
        notificationSent: todo.notificationSent,
      });
      const user = await User.findById(todo.userId);

      // Send Email
      // Send Email
      if (user?.email) {
        try {
          console.log("\n================ EMAIL TRIGGER =================");
          console.log("Trigger Time (UTC):", new Date().toISOString());
          console.log(
            "Trigger Time (IST):",
            new Date().toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            }),
          );

          console.log("Todo ID:", todo._id);
          console.log("User:", user.name);
          console.log("Email:", user.email);
          console.log("Title:", todo.title);
          console.log("Scheduled Time:", todo.scheduledTime);

          const start = Date.now();

          await emailService.sendDelayTaskEmail(user.email, user.name, todo);

          const end = Date.now();

          console.log("✅ Email Sent Successfully");
          console.log("Completed At (UTC):", new Date().toISOString());
          console.log(
            "Completed At (IST):",
            new Date().toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            }),
          );
          console.log(`Email Sending Time: ${end - start} ms`);
          console.log("===============================================\n");
        } catch (err) {
          console.log("\n================ EMAIL ERROR =================");
          console.log("Failed At (UTC):", new Date().toISOString());
          console.log(
            "Failed At (IST):",
            new Date().toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            }),
          );

          console.log("Todo ID:", todo._id);
          console.log("Email:", user.email);

          console.log("Message:", err.message);
          console.log("Code:", err.code);
          console.log("Command:", err.command);
          console.log("Response:", err.response);
          console.log("ResponseCode:", err.responseCode);
          console.log("Stack:", err.stack);

          console.log("==============================================\n");
        }
      }

      // Update Todo
      await Todo.findByIdAndUpdate(todo._id, {
        isDelayed: true,
        notificationSent: true,
      });

      delayedTasks.push({
        todoId: todo._id,
        title: todo.title,
        scheduledTime: todo.scheduledTime,
        email: user?.email,
      });
    }
  }

  console.log("\n====================================");
  console.log("Delayed Tasks =", delayedTasks);
  console.log("====================================");

  return delayedTasks;
};


const IST_OFFSET = 5.5 * 60 * 60 * 1000;

const getISTDayRange = () => {
  const now = new Date();

  // Shift current instant into IST calendar
  const istNow = new Date(now.getTime() + IST_OFFSET);

  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth();
  const day = istNow.getUTCDate();

  // Start of today in IST, represented as UTC
  const today = new Date(
    Date.UTC(year, month, day) - IST_OFFSET
  );

  // Start of tomorrow in IST, represented as UTC
  const tomorrow = new Date(
    today.getTime() + 24 * 60 * 60 * 1000
  );

  // Start of day after tomorrow
  const dayAfterTomorrow = new Date(
    tomorrow.getTime() + 24 * 60 * 60 * 1000
  );

  return {
    today,
    tomorrow,
    dayAfterTomorrow,
  };
};

const getISTString = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "long",
  });
};

const autoCreateDailyTodos = async () => {
  try {
    console.log("========== AUTO TODO STARTED ==========");

    const {
      today,
      tomorrow,
      dayAfterTomorrow,
    } = getISTDayRange();

    console.log("Today UTC:", today.toISOString());
    console.log("Today IST:", getISTString(today));

    console.log("Tomorrow UTC:", tomorrow.toISOString());
    console.log("Tomorrow IST:", getISTString(tomorrow));

    console.log(
      "Day After Tomorrow UTC:",
      dayAfterTomorrow.toISOString()
    );

    // Find the latest non-deleted todo for each user + title
    const recurringTodos = await Todo.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },

      {
        $sort: {
          date: -1,
          createdAt: -1,
        },
      },

      {
        $group: {
          _id: {
            userId: "$userId",
            title: "$title",
          },

          todo: {
            $first: "$$ROOT",
          },
        },
      },

      // Only continue recurrence if latest todo still has auto-add enabled
      {
        $match: {
          "todo.isAutoAddEveryday": true,
        },
      },
    ]);

    console.log(
      `Recurring todos found: ${recurringTodos.length}`
    );

    for (const item of recurringTodos) {
      const todo = item.todo;

      try {
        console.log("----------------------------------");
        console.log(`Checking: ${todo.title}`);

        console.log(
          "Source todo date IST:",
          getISTString(todo.date)
        );

        // Check if same todo already exists tomorrow
        const alreadyExists = await Todo.findOne({
          userId: todo.userId,
          title: todo.title,
          isDeleted: false,

          date: {
            $gte: tomorrow,
            $lt: dayAfterTomorrow,
          },
        }).lean();

        if (alreadyExists) {
          console.log(
            `Already exists tomorrow -> ${todo.title}`
          );

          console.log(
            "Existing date UTC:",
            new Date(alreadyExists.date).toISOString()
          );

          console.log(
            "Existing date IST:",
            getISTString(alreadyExists.date)
          );

          continue;
        }

        const createdTodo = await Todo.create({
          userId: todo.userId,

          title: todo.title,
          description: todo.description,

          // Tomorrow 00:00 IST
          date: tomorrow,

          scheduledTime: todo.scheduledTime,

          taskType: todo.taskType,
          targetvalue: todo.targetvalue,
          unit: todo.unit,
          priority: todo.priority,

          actualValue: 0,

          status: "PENDING",

          completedAt: null,

          delayReason: "",
          delayReasonSubmittedAt: null,

          remarks: "",

          isEdited: false,
          editedAt: null,

          isDeleted: false,
          deletedAt: null,

          notificationSent: false,
          isDelayed: false,

          completionPercentage: 0,

          // Continue daily recurrence
          isAutoAddEveryday: true,
        });

        console.log(`Created -> ${createdTodo.title}`);

        console.log(
          "Created date UTC:",
          createdTodo.date.toISOString()
        );

        console.log(
          "Created date IST:",
          getISTString(createdTodo.date)
        );
      } catch (todoError) {
        console.error(
          `Failed creating todo -> ${todo.title}`,
          todoError
        );
      }
    }

    console.log("========== AUTO TODO COMPLETED ==========");
  } catch (error) {
    console.error(
      "AUTO TODO ERROR:",
      error
    );
  }
};

module.exports = {
  checkDelayedTasks,
  autoCreateDailyTodos,
};
