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
      }),
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

        const [hours, minutes] = todo.scheduledTime.split(":").map(Number);

        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
          console.log(`Invalid scheduledTime: ${todo.scheduledTime}`);
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

        const scheduledMilliseconds = (hours * 60 + minutes) * 60 * 1000;

        const taskDateTime = new Date(
          baseDate.getTime() + scheduledMilliseconds,
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

        const isDelayed = taskDateTime.getTime() <= now.getTime();

        console.log("Is Delayed =", isDelayed);

        // Not delayed yet
        if (!isDelayed) {
          console.log(`Not delayed yet -> ${todo.title}`);
          continue;
        }

        // Already notified
        if (todo.notificationSent) {
          console.log(`Notification already sent -> ${todo.title}`);
          continue;
        }

        console.log(`Delayed Task Found -> ${todo.title}`);

        const user = await User.findById(todo.userId);

        // -----------------------------------------
        // SEND EMAIL
        // -----------------------------------------

        if (user?.email) {
          try {
            console.log("\n================ EMAIL TRIGGER =================");

            console.log("Trigger UTC:", new Date().toISOString());

            console.log(
              "Trigger IST:",
              new Date().toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              }),
            );

            console.log("Todo ID:", todo._id);
            console.log("User:", user.name);
            console.log("Email:", user.email);
            console.log("Title:", todo.title);

            console.log("Scheduled Time:", todo.scheduledTime);

            console.log(
              "Task DateTime IST:",
              taskDateTime.toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              }),
            );

            const start = Date.now();

            await emailService.sendDelayTaskEmail(user.email, user.name, todo);

            const end = Date.now();

            console.log("✅ Email Sent Successfully");

            console.log(`Email Sending Time: ${end - start} ms`);

            console.log("===============================================\n");
          } catch (err) {
            console.log("\n================ EMAIL ERROR =================");

            console.log("Todo ID:", todo._id);

            console.log("Email:", user.email);

            console.log("Message:", err.message);

            console.log("Stack:", err.stack);

            console.log("==============================================\n");

            // If email fails, don't mark notificationSent=true
            continue;
          }
        }

        // -----------------------------------------
        // UPDATE TODO
        // -----------------------------------------

        await Todo.findByIdAndUpdate(todo._id, {
          $set: {
            isDelayed: true,
            notificationSent: true,
          },
        });

        delayedTasks.push({
          todoId: todo._id,
          title: todo.title,
          scheduledTime: todo.scheduledTime,
          taskDateTime: taskDateTime.toISOString(),
          email: user?.email,
        });
      } catch (todoError) {
        console.error(`Error checking todo ${todo._id}:`, todoError);
      }
    }

    console.log("\n====================================");
    console.log("Delayed Tasks =", delayedTasks);
    console.log("====================================");

    return delayedTasks;
  } catch (error) {
    console.error("CHECK DELAYED TASKS ERROR:", error);

    throw error;
  }
};

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

// ============================================
// IST DATE HELPERS
// ============================================

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


// ============================================
// CONVERT DATE TO YYYY-MM-DD IN IST
// ============================================
//
// Supports:
//
// "2026-08-21"
//
// AND
//
// ISODate("2026-08-20T18:30:00.000Z")
//
// Both return:
//
// "2026-08-21"
// ============================================

const getDateStringIST = (value) => {
  // Already a string
  if (typeof value === "string") {
    return value.substring(0, 10);
  }

  // MongoDB Date / JS Date
  const date = new Date(value);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
};


// ============================================
// AUTO CREATE DAILY TODOS
// ============================================

const autoCreateDailyTodos = async () => {
  try {
    console.log(
      "========== AUTO TODO STARTED =========="
    );

    // ============================================
    // STEP 1
    // GET TODAY DATE
    // ============================================

    const today = getTodayIST();

    console.log("Today:", today);


    // ============================================
    // STEP 2
    // FIND THE LAST TODO ADDED IN DATABASE
    // ============================================
    //
    // We are NOT:
    //
    // - grouping by title
    // - finding latest todo for each title
    //
    // We only find the LAST todo inserted.
    // ============================================

    const lastTodo = await Todo.findOne({
      isDeleted: false,
    })
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .lean();


    // ============================================
    // NO TODOS FOUND
    // ============================================

    if (!lastTodo) {
      console.log("No todos found in database.");

      console.log(
        "========== AUTO TODO COMPLETED =========="
      );

      return;
    }


    // ============================================
    // STEP 3
    // GET DATE OF LAST TODO
    // ============================================

    const sourceDate =
      getDateStringIST(lastTodo.date);


    console.log("----------------------------------");

    console.log(
      "Last todo added:",
      lastTodo.title
    );

    console.log(
      "Last todo raw date:",
      lastTodo.date
    );

    console.log(
      "Source date:",
      sourceDate
    );

    console.log(
      "Today:",
      today
    );


    // ============================================
    // STEP 4
    // GET ALL TODOS FROM SOURCE DATE
    // ============================================
    //
    // Example:
    //
    // Last todo in DB:
    //
    // {
    //   title: "One Fruit",
    //   date: "2026-08-21"
    // }
    //
    // sourceDate:
    //
    // "2026-08-21"
    //
    // Now get ALL todos from 2026-08-21
    //
    // BUT only:
    //
    // isAutoAddEveryday: true
    //
    // ============================================

    const sourceTodos = await Todo.aggregate([
      // ------------------------------------------
      // ACTIVE TODOS ONLY
      // ------------------------------------------

      {
        $match: {
          isDeleted: false,
          isAutoAddEveryday: true,
        },
      },


      // ------------------------------------------
      // NORMALIZE DATE
      // ------------------------------------------
      //
      // This handles old Mongo Date values
      // and new String date values.
      // ------------------------------------------

      {
        $set: {
          normalizedDate: {
            $switch: {
              branches: [
                // ==================================
                // MongoDB Date
                // ==================================

                {
                  case: {
                    $eq: [
                      {
                        $type: "$date",
                      },
                      "date",
                    ],
                  },

                  then: {
                    $dateToString: {
                      date: "$date",
                      format: "%Y-%m-%d",
                      timezone: "Asia/Kolkata",
                    },
                  },
                },


                // ==================================
                // String
                // ==================================

                {
                  case: {
                    $eq: [
                      {
                        $type: "$date",
                      },
                      "string",
                    ],
                  },

                  then: {
                    $substrBytes: [
                      "$date",
                      0,
                      10,
                    ],
                  },
                },
              ],

              default: "",
            },
          },
        },
      },


      // ------------------------------------------
      // ONLY LAST TODO'S DATE
      // ------------------------------------------

      {
        $match: {
          normalizedDate: sourceDate,
        },
      },


      // ------------------------------------------
      // KEEP SAME ORDER AS ORIGINAL DAY
      // ------------------------------------------

      {
        $sort: {
          createdAt: 1,
          _id: 1,
        },
      },
    ]);


    console.log("----------------------------------");

    console.log(
      `Source date = ${sourceDate}`
    );

    console.log(
      `Auto todos found = ${sourceTodos.length}`
    );


    // ============================================
    // NOTHING TO AUTO CREATE
    // ============================================

    if (sourceTodos.length === 0) {
      console.log(
        `No auto-add todos found on ${sourceDate}`
      );

      console.log(
        "========== AUTO TODO COMPLETED =========="
      );

      return;
    }


    // ============================================
    // STEP 5
    // LOOP THROUGH SOURCE DATE TODOS
    // ============================================

    for (const todo of sourceTodos) {
      try {
        console.log(
          "----------------------------------"
        );

        console.log(
          "Checking todo:",
          todo.title
        );

        console.log(
          "User:",
          todo.userId
        );

        console.log(
          "Source date:",
          sourceDate
        );

        console.log(
          "Auto add:",
          todo.isAutoAddEveryday
        );


        // ========================================
        // SAFETY CHECK
        // ========================================

        if (
          todo.isAutoAddEveryday !== true
        ) {
          console.log(
            `Skipping auto disabled -> ${todo.title}`
          );

          continue;
        }


        // ========================================
        // STEP 6
        // CHECK IF SAME TODO ALREADY EXISTS TODAY
        // ========================================
        //
        // Handles:
        //
        // date: "2026-08-24"
        //
        // and old:
        //
        // date: ISODate(...)
        //
        // ========================================

        const alreadyExists =
          await Todo.findOne({
            userId: todo.userId,

            title: todo.title,

            isDeleted: false,

            $expr: {
              $eq: [
                {
                  $switch: {
                    branches: [
                      // --------------------------
                      // MongoDB Date
                      // --------------------------

                      {
                        case: {
                          $eq: [
                            {
                              $type: "$date",
                            },
                            "date",
                          ],
                        },

                        then: {
                          $dateToString: {
                            date: "$date",
                            format: "%Y-%m-%d",
                            timezone:
                              "Asia/Kolkata",
                          },
                        },
                      },


                      // --------------------------
                      // String date
                      // --------------------------

                      {
                        case: {
                          $eq: [
                            {
                              $type: "$date",
                            },
                            "string",
                          ],
                        },

                        then: {
                          $substrBytes: [
                            "$date",
                            0,
                            10,
                          ],
                        },
                      },
                    ],

                    default: "",
                  },
                },

                today,
              ],
            },
          }).lean();


        // ========================================
        // ALREADY EXISTS TODAY
        // ========================================

        if (alreadyExists) {
          console.log(
            `Already exists today -> ${todo.title}`
          );

          continue;
        }


        // ========================================
        // STEP 7
        // CREATE TODO FOR TODAY
        // ========================================

        const createdTodo =
          await Todo.create({
            userId: todo.userId,

            title: todo.title,

            description:
              todo.description,

            // ====================================
            // TODAY
            // ====================================

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


            // ====================================
            // RESET DAILY VALUES
            // ====================================

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


            // ====================================
            // KEEP AUTO ADD ON
            // ====================================

            isAutoAddEveryday: true,

            cancelReason: "",

            cancelledAt: null,
          });


        // ========================================
        // CREATED
        // ========================================

        console.log(
          `Created -> ${createdTodo.title}`
        );

        console.log(
          `Source: ${sourceDate} -> Today: ${today}`
        );

      } catch (todoError) {
        console.error(
          `Failed creating todo -> ${todo.title}`,
          todoError
        );
      }
    }


    // ============================================
    // COMPLETED
    // ============================================

    console.log(
      "========== AUTO TODO COMPLETED =========="
    );

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
