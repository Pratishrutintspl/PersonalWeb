const todoModel = require("../models/todo");
const activitylogs = require("../services/activityService");
const activityServicActions = require("../constants/activityActions");
const User = require("../models/user");
const mongoose = require("mongoose");

const validateDateString = (date) => {
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new Error("Date must be YYYY-MM-DD");
  }

  return date;
};


const combineDateAndTimeIST = (
  date,
  scheduledTime
) => {
  validateDateString(date);

  if (
    typeof scheduledTime !== "string" ||
    !/^([01]\d|2[0-3]):([0-5]\d)$/.test(
      scheduledTime
    )
  ) {
    throw new Error(
      "Scheduled time must be HH:mm"
    );
  }

  // Only here do we convert date+time into
  // an actual moment for comparison.
  return new Date(
    `${date}T${scheduledTime}:00.000+05:30`
  );
};


const getTodayIST = () => {
  const parts =
    new Intl.DateTimeFormat("en-US", {
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
  validateDateString(dateString);

  const [year, month, day] =
    dateString.split("-").map(Number);

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

const normalizeTodoDateIST = (dateInput) => {
  const dateString = getISTDateString(dateInput);

  return new Date(
    `${dateString}T00:00:00.000+05:30`
  );
};

const createTodo = async (
  tododata,
  userId
) => {
  if (!userId) {
    throw new Error("User not found");
  }

  if (!tododata.date) {
    throw new Error("Todo date is required");
  }

  validateDateString(tododata.date);

  let isDelayed = false;

  if (tododata.scheduledTime) {
    const taskDateTime =
      combineDateAndTimeIST(
        tododata.date,
        tododata.scheduledTime
      );

    const now = new Date();

    isDelayed =
      taskDateTime.getTime() <= now.getTime();
  }

  const todo = await todoModel.create({
    ...tododata,

    userId,

    // Store exactly what frontend sends
    // "2026-08-17"
    date: tododata.date,

    status: "PENDING",

    isDelayed,

    // Only set true after notification
    // is actually sent
    notificationSent: false,

    completedAt: null,

    delayReason: "",

    delayReasonSubmittedAt: null,

    actualValue:
      tododata.actualValue ?? 0,

    completionPercentage: 0,

    isAutoAddEveryday:
      tododata.isAutoAddEveryday ?? false,
  });

  const user = await User.findById(userId);

  if (user) {
    await activitylogs.createActivity({
      userId,

      action:
        activityServicActions.CREATE_TASK,

      module: "TODO",

      description:
        `${user.email} created a todo task`,
    });
  }

  return todo;
};
const todoList = async (userId) => {
  console.log("userrrrrrrID=", userId);
  return await todoModel.find({ userId }).sort({ createdAt: -1 });
};

const todoListDate = async (
  userId,
  date,
  page = 1,
  limit = 10,
  search = ""
) => {
  if (!userId) {
    throw new Error("User not found");
  }

  validateDateString(date);

  const query = {
    userId,
    isDeleted: false,
    date,
  };

  if (search && search.trim() !== "") {
    query.$or = [
      {
        title: {
          $regex: search,
          $options: "i",
        },
      },
      {
        description: {
          $regex: search,
          $options: "i",
        },
      },
      {
        cancelReason: {
          $regex: search,
          $options: "i",
        },
      },
      {
        remarks: {
          $regex: search,
          $options: "i",
        },
      },
      {
        taskType: {
          $regex: search,
          $options: "i",
        },
      },
      {
        priority: {
          $regex: search,
          $options: "i",
        },
      },
      {
        status: {
          $regex: search,
          $options: "i",
        },
      },
      {
        scheduledTime: {
          $regex: search,
          $options: "i",
        },
      },
      {
        unit: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const todos =
    await todoModel.find(query);

  todos.sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === "PENDING") {
        return -1;
      }

      if (b.status === "PENDING") {
        return 1;
      }
    }

    return a.scheduledTime.localeCompare(
      b.scheduledTime
    );
  });

  const totalRecords = todos.length;

  const skip =
    (Number(page) - 1) * Number(limit);

  const todoList = todos.slice(
    skip,
    skip + Number(limit)
  );

  const user =
    await User.findById(userId);

  if (user) {
    await activitylogs.createActivity({
      userId,

      action:
        activityServicActions.DATE_TASK,

      module: "DAILY INFO",

      description:
        `${user.name} searched "${search}" for ${date}`,
    });
  }

  return {
    todoList,

    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalRecords,

      totalPages: Math.ceil(
        totalRecords / Number(limit)
      ),

      hasNextPage:
        Number(page) * Number(limit) <
        totalRecords,

      hasPreviousPage:
        Number(page) > 1,
    },
  };
};

const updateTodo = async (todoId, userId, updateData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const existingTodo = await todoModel.findOne({
    _id: todoId,
    userId,
    isDeleted: false,
  });

  if (!existingTodo) {
    throw new Error("Todo not found");
  }

  // ============================================
  // Validate date if user is updating it
  // ============================================
  if (updateData.date) {
    validateDateString(updateData.date);
  }

  const updatePayload = {
    ...updateData,

    isEdited: true,
    editedAt: new Date(),

    isAutoAddEveryday:
      updateData.isAutoAddEveryday !== undefined
        ? updateData.isAutoAddEveryday
        : existingTodo.isAutoAddEveryday,
  };

  // ============================================
  // DATE / TIME CHANGED
  // ============================================
  if (
    updateData.date !== undefined ||
    updateData.scheduledTime !== undefined
  ) {
    // Both are strings now
    //
    // Example:
    // taskDate = "2026-08-17"
    // scheduledTime = "16:20"

    const taskDate =
      updateData.date || existingTodo.date;

    const scheduledTime =
      updateData.scheduledTime ||
      existingTodo.scheduledTime;

    validateDateString(taskDate);

    if (scheduledTime) {
      // Converts only for datetime comparison:
      //
      // "2026-08-17" + "16:20"
      // ->
      // 17 Aug 2026 16:20 IST
      const taskDateTime = combineDateAndTimeIST(
        taskDate,
        scheduledTime
      );

      const now = new Date();

      const isDelayed =
        taskDateTime.getTime() <= now.getTime();

      updatePayload.isDelayed = isDelayed;

      // IMPORTANT:
      // Date/time changed, so previous notification
      // should not automatically be considered sent.
      updatePayload.notificationSent = false;

      if (!isDelayed) {
        updatePayload.delayReason = "";
        updatePayload.delayReasonSubmittedAt = null;
      }
    }
  }

  // ============================================
  // TASK STATUS
  // ============================================

  // COMPLETED
  if (updateData.status === "COMPLETED") {
    updatePayload.completedAt = new Date();

    updatePayload.cancelledAt = null;
    updatePayload.cancelReason = "";

    if (updateData.remarks !== undefined) {
      updatePayload.remarks = updateData.remarks;
    }
  }

  // PENDING
  else if (updateData.status === "PENDING") {
    updatePayload.completedAt = null;

    updatePayload.cancelledAt = null;
    updatePayload.cancelReason = "";

    if (updateData.remarks !== undefined) {
      updatePayload.remarks = updateData.remarks;
    }

    // Recalculate delay state when changing
    // an existing task back to PENDING.
    const taskDate =
      updateData.date || existingTodo.date;

    const scheduledTime =
      updateData.scheduledTime ||
      existingTodo.scheduledTime;

    if (taskDate && scheduledTime) {
      const taskDateTime = combineDateAndTimeIST(
        taskDate,
        scheduledTime
      );

      updatePayload.isDelayed =
        taskDateTime.getTime() <= Date.now();

      // Let cron send notification if necessary
      updatePayload.notificationSent = false;
    }
  }

  // CANCELLED
  else if (updateData.status === "CANCELLED") {
    if (!updateData.cancelReason?.trim()) {
      throw new Error(
        "Cancellation reason is required"
      );
    }

    updatePayload.cancelReason =
      updateData.cancelReason.trim();

    updatePayload.cancelledAt = new Date();

    updatePayload.completedAt = null;

    if (updateData.remarks !== undefined) {
      updatePayload.remarks =
        updateData.remarks;
    }
  }

  // ============================================
  // DELAY REASON
  // ============================================
  if (updateData.delayReason?.trim()) {
    updatePayload.delayReason =
      updateData.delayReason.trim();

    updatePayload.isDelayed = true;

    /*
      Keep notificationSent true here ONLY if
      delayReason is submitted by the user after
      receiving the delayed-task notification.

      In that workflow this is reasonable because
      the notification has already happened.
    */
    updatePayload.notificationSent = true;

    if (
      !existingTodo.delayReasonSubmittedAt
    ) {
      updatePayload.delayReasonSubmittedAt =
        new Date();
    }
  }

  // ============================================
  // UPDATE
  // ============================================
  const todo =
    await todoModel.findOneAndUpdate(
      {
        _id: todoId,
        userId,
        isDeleted: false,
      },
      updatePayload,
      {
        new: true,
        runValidators: true,
      }
    );

  // ============================================
  // ACTIVITY LOG
  // ============================================
  let activityDescription =
    `${user.email} updated a todo task`;

  if (updateData.status === "COMPLETED") {
    activityDescription =
      `${user.email} completed a todo task`;
  }

  if (updateData.status === "CANCELLED") {
    activityDescription =
      `${user.email} cancelled a todo task`;
  }

  if (updateData.status === "PENDING") {
    activityDescription =
      `${user.email} marked a todo as pending`;
  }

  await activitylogs.createActivity({
    userId,
    action:
      activityServicActions.UPDATE_TASK,
    module: "TODO",
    description: activityDescription,
  });

  return todo;
};

const deleteTodo = async (todoId, userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const todo = await todoModel.findOneAndUpdate(
    {
      _id: todoId,
      userId,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    },
    {
      new: true,
    }
  );

  if (!todo) {
    throw new Error("Todo not found");
  }

  await activitylogs.createActivity({
    userId,
    action: activityServicActions.DELETE_TASK,
    module: "TODO",
    description: `${user.email} deleted a todo task`,
  });

  return todo;
};

const todoCountByDate = async (userId) => {
  if (!userId) {
    throw new Error("User not found");
  }

  const objectId = new mongoose.Types.ObjectId(userId);

  return await todoModel.aggregate([
    {
      $match: {
        userId: objectId,
        isDeleted: false,
      },
    },

    {
      $addFields: {
        normalizedDate: {
          $cond: [
            {
              $eq: [
                { $type: "$date" },
                "date",
              ],
            },

            {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date",
                timezone: "Asia/Kolkata",
              },
            },

            "$date",
          ],
        },
      },
    },

    {
      $group: {
        _id: "$normalizedDate",
        count: {
          $sum: 1,
        },
      },
    },

    {
      $project: {
        _id: 0,
        date: "$_id",
        count: 1,
      },
    },

    {
      $sort: {
        date: 1,
      },
    },
  ]);
};

const getDashboard = async (
  userId,
  date
) => {
  if (!userId) {
    throw new Error("User not found");
  }

  if (!date) {
    throw new Error("Date is required");
  }

  validateDateString(date);

  const query = {
    userId,
    isDeleted: false,
    date,
  };

  const [
    totalTasks,
    completedTasks,
    pendingTasks,
    delayedTasks,
  ] = await Promise.all([
    todoModel.countDocuments(
      query
    ),

    todoModel.countDocuments({
      ...query,
      status: "COMPLETED",
    }),

    todoModel.countDocuments({
      ...query,
      status: "PENDING",
    }),

    todoModel.countDocuments({
      ...query,
      isDelayed: true,
    }),
  ]);

  const completionRate =
    totalTasks > 0
      ? Math.round(
          (completedTasks /
            totalTasks) *
            100
        )
      : 0;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    delayedTasks,
    completionRate,
  };
};
const checkDelayedTaskss = async (userId, date) => {
  try {
    console.log("Checking delayed tasks");
    console.log("User ID:", userId);
    console.log("Date:", date);

    // Current time in HH:mm format
    const currentTime = new Date()
      .toTimeString()
      .slice(0, 5);

    console.log("Current Time:", currentTime);


    const delayedTasks = await todoModel.find({
      userId: userId,

      date: date,

      status: "PENDING",

      isDeleted: false,

      // Task time already crossed
      scheduledTime: {
        $lt: currentTime
      }
    })
    .sort({
      scheduledTime: 1
    })
    .lean();


    console.log(
      "Delayed Tasks Found:",
      delayedTasks.length
    );

    console.log(delayedTasks);


    return delayedTasks;


  } catch(error) {

    console.error("Delayed Task Error:", error);

    throw error;

  }
};



module.exports = {
  createTodo,
  todoListDate,
  updateTodo,
  deleteTodo,
  todoList,
  todoCountByDate,
  getDashboard,
  checkDelayedTaskss
};
