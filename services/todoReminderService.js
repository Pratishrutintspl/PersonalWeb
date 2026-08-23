const Todo = require("../models/todo");
const User = require("../models/user");
const emailService = require("./emailService");
const transporter = require("../config/mailConfig");

const checkDelayedTasks = async () => {
  try {
    const now = new Date();

    console.log("====================================");
    console.log("Current UTC:", now.toISOString());

    console.log(
      "Current IST:",
      now.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })
    );

    console.log("====================================");

    const todos = await Todo.find({
      status: "PENDING",
      isDeleted: false,
    });

    console.log("Pending Todos Found =", todos.length);

    const delayedTasks = [];

    for (const todo of todos) {
      try {
        console.log("\n====================================");
        // console.log("Todo ID =", todo._id);
        // console.log("Title =", todo.title);
        // console.log("Stored Date =", todo.date);
        // console.log("Scheduled Time =", todo.scheduledTime);

        if (!todo.scheduledTime) {
          console.log("No scheduledTime found");
          continue;
        }

        // -----------------------------------------
        // Parse scheduled time
        // -----------------------------------------

        const [hours, minutes] = todo.scheduledTime
          .split(":")
          .map(Number);

        if (
          Number.isNaN(hours) ||
          Number.isNaN(minutes)
        ) {
          console.log(
            `Invalid scheduledTime: ${todo.scheduledTime}`
          );
          continue;
        }

        // -----------------------------------------
        // IMPORTANT FIX
        //
        // todo.date is stored as 00:00 IST.
        //
        // Example:
        // MongoDB:
        // 2026-08-16T18:30:00.000Z
        //
        // IST:
        // 17 Aug 2026 00:00
        //
        // Simply add scheduled hours/minutes
        // to that timestamp.
        // -----------------------------------------

        const baseDate = new Date(todo.date);

        const scheduledMilliseconds =
          (hours * 60 + minutes) * 60 * 1000;

        const taskDateTime = new Date(
          baseDate.getTime() + scheduledMilliseconds
        );

        // console.log(
        //   "Task DateTime UTC =",
        //   taskDateTime.toISOString()
        // );

        // console.log(
        //   "Task DateTime IST =",
        //   taskDateTime.toLocaleString("en-IN", {
        //     timeZone: "Asia/Kolkata",
        //   })
        // );

        // console.log(
        //   "Current UTC =",
        //   now.toISOString()
        // );

        // console.log(
        //   "Current IST =",
        //   now.toLocaleString("en-IN", {
        //     timeZone: "Asia/Kolkata",
        //   })
        // );

        // -----------------------------------------
        // Check delayed
        // -----------------------------------------

        const isDelayed =
          taskDateTime.getTime() <= now.getTime();

        // console.log("Is Delayed =", isDelayed);

        // Not delayed yet
        if (!isDelayed) {
          console.log(
            `Not delayed yet -> ${todo.title}`
          );
          continue;
        }

        // Already notified
        if (todo.notificationSent) {
          // console.log(
          //   `Notification already sent -> ${todo.title}`
          // );
          continue;
        }

        // console.log(
        //   `Delayed Task Found -> ${todo.title}`
        // );

        const user = await User.findById(
          todo.userId
        );

        // -----------------------------------------
        // SEND EMAIL
        // -----------------------------------------

        if (user?.email) {
          try {
            console.log(
              "\n================ EMAIL TRIGGER ================="
            );

            console.log(
              "Trigger UTC:",
              new Date().toISOString()
            );

            console.log(
              "Trigger IST:",
              new Date().toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })
            );

            // console.log("Todo ID:", todo._id);
            // console.log("User:", user.name);
            // console.log("Email:", user.email);
            // console.log("Title:", todo.title);

            // console.log(
            //   "Scheduled Time:",
            //   todo.scheduledTime
            // );

            console.log(
              "Task DateTime IST:",
              taskDateTime.toLocaleString(
                "en-IN",
                {
                  timeZone: "Asia/Kolkata",
                }
              )
            );

            const start = Date.now();

            await emailService.sendDelayTaskEmail(
              user.email,
              user.name,
              todo
            );

            const end = Date.now();

            console.log(
              "✅ Email Sent Successfully"
            );

            console.log(
              `Email Sending Time: ${end - start} ms`
            );

            console.log(
              "===============================================\n"
            );
          } catch (err) {
            console.log(
              "\n================ EMAIL ERROR ================="
            );

            console.log(
              "Todo ID:",
              todo._id
            );

            console.log(
              "Email:",
              user.email
            );

            console.log(
              "Message:",
              err.message
            );

            console.log(
              "Stack:",
              err.stack
            );

            // console.log(
            //   "==============================================\n"
            // );

            // If email fails, don't mark notificationSent=true
            continue;
          }
        }

        // -----------------------------------------
        // UPDATE TODO
        // -----------------------------------------

        await Todo.findByIdAndUpdate(
          todo._id,
          {
            $set: {
              isDelayed: true,
              notificationSent: true,
            },
          }
        );

        delayedTasks.push({
          todoId: todo._id,
          title: todo.title,
          scheduledTime: todo.scheduledTime,
          taskDateTime:
            taskDateTime.toISOString(),
          email: user?.email,
        });
      } catch (todoError) {
        console.error(
          `Error checking todo ${todo._id}:`,
          todoError
        );
      }
    }

    console.log("\n====================================");
    // console.log(
    //   "Delayed Tasks =",
    //   delayedTasks
    // );
    console.log("====================================");

    return delayedTasks;
  } catch (error) {
    console.error(
      "CHECK DELAYED TASKS ERROR:",
      error
    );

    throw error;
  }
};


const IST_OFFSET = 5.5 * 60 * 60 * 1000;





// ============================================
// IST DATE HELPERS
// ============================================

const getISTDayRange = () => {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  // Example if today is 17 Aug 2026:
  // 17 Aug 2026 00:00 IST
  // = 16 Aug 2026 18:30 UTC
  const today = new Date(
    `${values.year}-${values.month}-${values.day}T00:00:00.000+05:30`
  );

  // India has no daylight-saving changes,
  // so adding 24 hours is safe here.
  const tomorrow = new Date(
    today.getTime() + 24 * 60 * 60 * 1000
  );

  const dayAfterTomorrow = new Date(
    today.getTime() + 2 * 24 * 60 * 60 * 1000
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
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};


// ============================================
// AUTO CREATE DAILY TODOS
// ============================================
const getTodayIST = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
};


const addDaysToDate = (dateString, days) => {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  const y = date.getUTCFullYear();

  const m = String(
    date.getUTCMonth() + 1
  ).padStart(2, "0");

  const d = String(
    date.getUTCDate()
  ).padStart(2, "0");

  return `${y}-${m}-${d}`;
};

const autoCreateDailyTodos = async () => {
  try {
    console.log(
      "========== AUTO TODO STARTED =========="
    );

    // ============================================
    // DATE STRINGS ONLY
    // ============================================

    const today = getTodayIST();

    const tomorrow = addDaysToDate(
      today,
      1
    );

    const dayAfterTomorrow =
      addDaysToDate(
        today,
        2
      );

    console.log("Today:", today);
    console.log("Tomorrow:", tomorrow);
    console.log(
      "Day After Tomorrow:",
      dayAfterTomorrow
    );

    // Example:
    
    // Today: 2026-08-17
    // Tomorrow: 2026-08-18
    // Day After Tomorrow: 2026-08-19


    // ============================================
    // GET LATEST TODO FOR EACH USER + TITLE
    // ============================================

    // const recurringTodos =
    //   await Todo.aggregate([
    //     {
    //       $match: {
    //         isDeleted: false,
    //       },
    //     },

    //     {
    //       $sort: {
    //         date: -1,
    //         createdAt: -1,
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

    //     {
    //       $match: {
    //         "todo.isAutoAddEveryday": true,
    //       },
    //     },
    //   ]);

    const latestTodos = await Todo.aggregate([
  {
    $match: {
      isDeleted: false,
    },
  },
  {
    $sort: {
      updatedAt: -1,
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
]);

latestTodos.forEach(({ todo }) => {
  console.log({
    title: todo.title,
    date: todo.date,
    auto: todo.isAutoAddEveryday,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
    id: todo._id,
  });
});
  

    for (const item of recurringTodos) {
      const todo = item.todo;

      try {
        console.log(
          "----------------------------------"
        );

        console.log(
          `Checking: ${todo.title}`
        );

        console.log(
          "Source todo date:",
          todo.date
        );


        // ============================================
        // CHECK IF SAME TODO EXISTS TODAY
        // ============================================

        const alreadyExists =
          await Todo.findOne({
            userId: todo.userId,

            title: todo.title,

            isDeleted: false,

            // Exact string match
            date: today,
          }).lean();


        if (alreadyExists) {
          console.log(
            `Already exists today -> ${todo.title}`
          );

          console.log(
            "Existing date:",
            alreadyExists.date
          );

          continue;
        }


        // ============================================
        // CREATE TODAY'S TODO
        // ============================================

        const createdTodo =
          await Todo.create({
            userId: todo.userId,

            title: todo.title,

            description:
              todo.description,

            // IMPORTANT:
            // String only
            //
            // "2026-08-17"
            date: today,

            scheduledTime:
              todo.scheduledTime,

            taskType:
              todo.taskType,

            targetvalue:
              todo.targetvalue,

            unit:
              todo.unit,

            priority:
              todo.priority,

            actualValue: 0,

            status: "PENDING",

            completedAt: null,

            delayReason: "",

            delayReasonSubmittedAt:
              null,

            remarks: "",

            isEdited: false,

            editedAt: null,

            isDeleted: false,

            deletedAt: null,

            notificationSent: false,

            isDelayed: false,

            completionPercentage: 0,

            isAutoAddEveryday: true,

            cancelReason: "",

            cancelledAt: null,
          });


        console.log(
          `Created -> ${createdTodo.title}`
        );

        console.log(
          "Created date:",
          createdTodo.date
        );

        // Should print:
        // 2026-08-17

      } catch (todoError) {
        console.error(
          `Failed creating todo -> ${todo.title}`,
          todoError
        );
      }
    }


    // console.log(
    //   "========== AUTO TODO COMPLETED =========="
    // );

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
