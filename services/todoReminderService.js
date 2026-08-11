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
// const autoCreateDailyTodos = async () => {
//   console.log("========== AUTO TODO STARTED ==========");

//   // Current IST Date
//   const istNow = new Date(
//     new Date().toLocaleString("en-US", {
//       timeZone: "Asia/Kolkata",
//     }),
//   );

//   // Store today's IST date
//   const today = new Date(istNow);
//   today.setHours(0, 0, 0, 0);

//   // Because Mongo stores UTC, shift to next UTC representation
//   today.setDate(today.getDate() + 1);

//   const tomorrow = new Date(today);
//   tomorrow.setDate(today.getDate() + 1);

//   // console.log("Current IST :", istNow);
//   // console.log("Today To Save :", today);

//   const recurringTodos = await Todo.aggregate([
//     {
//       $match: {
//         isDeleted: false,
//         isAutoAddEveryday: true,
//       },
//     },
//     {
//       $sort: {
//         date: -1,
//       },
//     },
//     {
//       $group: {
//         _id: {
//           userId: "$userId",
//           title: "$title",
//         },
//         todo: {
//           $first: "$$ROOT",
//         },
//       },
//     },
//   ]);

//   // console.log("Recurring Todos :", recurringTodos.length);

//   for (const item of recurringTodos) {
//     const todo = item.todo;

//     // console.log("----------------------------------");
//     // console.log("Checking :", todo.title);

//     // Latest recurring task is already for today
//     const todoDate = new Date(todo.date);
//     todoDate.setHours(0, 0, 0, 0);

//     if (todoDate.getTime() === today.getTime()) {
//       console.log(`Latest Todo already belongs to today -> ${todo.title}`);
//       continue;
//     }

//     // Check if today's task already exists
//     const alreadyExists = await Todo.findOne({
//       userId: todo.userId,
//       title: todo.title,
//       isDeleted: false,
//       date: {
//         $gte: today,
//         $lt: tomorrow,
//       },
//     });

//     if (alreadyExists) {
//       console.log(`Already Exists -> ${todo.title}`);
//       continue;
//     }

//     // console.log(`Creating today's task -> ${todo.title}`);

//     await Todo.create({
//       userId: todo.userId,

//       title: todo.title,
//       description: todo.description,

//       date: today,

//       scheduledTime: todo.scheduledTime,

//       taskType: todo.taskType,
//       targetvalue: todo.targetvalue,
//       unit: todo.unit,
//       priority: todo.priority,

//       actualValue: 0,
//       status: "PENDING",

//       completedAt: null,

//       delayReason: "",
//       delayReasonSubmittedAt: null,

//       remarks: "",

//       isEdited: false,
//       editedAt: null,

//       isDeleted: false,
//       deletedAt: null,

//       notificationSent: false,
//       isDelayed: false,

//       completionPercentage: 0,

//       isAutoAddEveryday: true,
//     });

//     // console.log(`Created -> ${todo.title}`);
//   }

//   // console.log("========== AUTO TODO COMPLETED ==========");
// };

const getISTDayRange = () => {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;

  const now = new Date();

  // Shift current instant into IST calendar
  const istNow = new Date(now.getTime() + IST_OFFSET);

  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth();
  const day = istNow.getUTCDate();

  // IST midnight represented as UTC
  const today = new Date(
    Date.UTC(year, month, day) - IST_OFFSET
  );

  const tomorrow = new Date(
    today.getTime() + 24 * 60 * 60 * 1000
  );

  return {
    today,
    tomorrow,
  };
};

const autoCreateDailyTodos = async () => {
  console.log("========== AUTO TODO STARTED ==========");

  const { today, tomorrow } = getISTDayRange();

  console.log("Today IST start:", today);
  console.log("Tomorrow IST start:", tomorrow);

  const recurringTodos = await Todo.aggregate([
    // First get all non-deleted todos
    {
      $match: {
        isDeleted: false,
      },
    },

    // Latest todo first
    {
      $sort: {
        date: -1,
        createdAt: -1,
      },
    },

    // Find latest todo for each user + title
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

    // IMPORTANT:
    // only recreate if the LATEST todo still has auto-add enabled
    {
      $match: {
        "todo.isAutoAddEveryday": true,
      },
    },
  ]);

  console.log(
    "Recurring todos:",
    recurringTodos.map((item) => ({
      title: item.todo.title,
      isAutoAddEveryday: item.todo.isAutoAddEveryday,
      date: item.todo.date,
    }))
  );

  for (const item of recurringTodos) {
    const todo = item.todo;

    console.log(`Checking -> ${todo.title}`);

    // Check whether today's todo already exists
    const alreadyExists = await Todo.findOne({
      userId: todo.userId,
      title: todo.title,
      isDeleted: false,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (alreadyExists) {
      console.log(`Already exists today -> ${todo.title}`);
      continue;
    }

    await Todo.create({
      userId: todo.userId,

      title: todo.title,
      description: todo.description,

      date: today,

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

      // Carry forward recurrence
      isAutoAddEveryday: todo.isAutoAddEveryday,
    });

    console.log(`Created -> ${todo.title}`);
  }

  console.log("========== AUTO TODO COMPLETED ==========");
};

module.exports = {
  checkDelayedTasks,
  autoCreateDailyTodos,
};
