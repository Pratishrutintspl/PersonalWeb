const todoModel = require("../models/todo");
const activitylogs = require("../services/activityService");
const activityServicActions = require("../constants/activityActions");
const User = require("../models/user");
const mongoose = require("mongoose");

const createTodo = async (tododata, userId) => {
  if (!userId) {
    throw new Error("User not found");
  }

  let isDelayed = false;
  let notificationSent = false;

  if (tododata.date && tododata.scheduledTime) {
    const taskDate = new Date(tododata.date);

    const [hours, minutes] = tododata.scheduledTime.split(":").map(Number);

    taskDate.setHours(hours, minutes, 0, 0);

    const now = new Date();

    if (taskDate <= now) {
      isDelayed = true;
      notificationSent = true;
    }
  }

  const todo = await todoModel.create({
    ...tododata,

    userId,

    status: "PENDING",

    isDelayed,
    notificationSent,

    completedAt: null,
    delayReason: "",
    delayReasonSubmittedAt: null,

    actualValue: tododata.actualValue || 0,
    completionPercentage: 0,

    isAutoAddEveryday: tododata.isAutoAddEveryday || false,
  });

  const user = await User.findById(userId);

  await activitylogs.createActivity({
    userId,
    action: activityServicActions.CREATE_TASK,
    module: "TODO",
    description: `${user.email} created a todo task`,
  });

  return todo;
};
const todoList = async (userId) => {
  console.log("userrrrrrrID=", userId);
  return await todoModel.find({ userId }).sort({ createdAt: -1 });
};

const todoListDate = async (userId, date, page = 1, limit = 10,search = "") => {
  if (!userId) {
    throw new Error("User not found");
  }

  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const query = {
    userId,
    isDeleted: false,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  };

if (search && search.trim() !== "") {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { cancelReason: { $regex: search, $options: "i" } },
      { remarks: { $regex: search, $options: "i" } },
      { taskType: { $regex: search, $options: "i" } },
      { priority: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
      { scheduledTime: { $regex: search, $options: "i" } },
      { unit: { $regex: search, $options: "i" } },
    ];
  }
  // Fetch all todos for that date
  const todos = await todoModel.find(query);

  // Sort:
  // 1. Pending first
  // 2. Completed last
  // 3. Time wise
  todos.sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === "PENDING") return -1;
      if (b.status === "PENDING") return 1;
    }

    return a.scheduledTime.localeCompare(b.scheduledTime);
  });

  const totalRecords = todos.length;

  const skip = (page - 1) * limit;

  const todoList = todos.slice(skip, skip + Number(limit));

  const user = await User.findById(userId);

  if (user) {
    await activitylogs.createActivity({
      userId,
      action: activityServicActions.DATE_TASK,
      module: "DAILY INFO",
     description: `${user.name} searched "${search}" for ${date}`,
    });
  }

  return {
    todoList,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
  };
};
// const todoListDate = async (userId, date) => {
//   const startDate = new Date(date);

//   const endDate = new Date(date);
//   endDate.setDate(endDate.getDate() + 1);
//   const user = await User.findById(userId);
//   if (!userId) {
//     throw new Error("User not found");
//   }

//   return await todoModel
//     .find({
//       userId,
//       isDeleted: false,
//       date: {
//         $gte: startDate,
//         $lt: endDate,
//       },
//     })
//     .sort({ scheduledTime: 1 });

//   await activitylogs.createActivity({
//     userId: userId,
//     action: activityServicActions.DATE_TASK,
//     module: "DAILY INFO",
//     description: `${user.name} viewed todo for ${date}`,
//   });
//   // return todoModel;
// };

// const updateTodo = async (todoId, userId, updateData) => {
//   const user = await User.findById(userId);

//   const updatePayload = {
//     ...updateData,
//     isEdited: true,
//     editedAt: new Date(),
//   };

//   // Handle completedAt automatically
//   if (updateData.status === "COMPLETED") {
//     updatePayload.completedAt = new Date();
//   } else if (updateData.status === "PENDING") {
//     updatePayload.completedAt = null;
//   }

//   const todo = await todoModel.findOneAndUpdate(
//     {
//       _id: todoId,
//       userId,
//       isDeleted: false,
//     },
//     updatePayload,
//     {
//       new: true,
//     },
//   );

//   await activitylogs.createActivity({
//     userId,
//     action: activityServicActions.UPDATE_TASK,
//     module: "TODO",
//     description: `${user.email} updated a todo task`,
//   });

//   return todo;
// };




// const updateTodo = async (todoId, userId, updateData) => {
//   const user = await User.findById(userId);

//   const existingTodo = await todoModel.findOne({
//     _id: todoId,
//     userId,
//     isDeleted: false,
//   });

//   if (!existingTodo) {
//     throw new Error("Todo not found");
//   }

//   const updatePayload = {
//     ...updateData,
//     isEdited: true,
//     editedAt: new Date(),

//     isAutoAddEveryday:
//       updateData.isAutoAddEveryday !== undefined
//         ? updateData.isAutoAddEveryday
//         : existingTodo.isAutoAddEveryday,
//   };

//   // ===========================
//   // If Date or Time Changed
//   // ===========================
//   if (updateData.date || updateData.scheduledTime) {
//     const taskDate = new Date(updateData.date || existingTodo.date);

//     const scheduledTime =
//       updateData.scheduledTime || existingTodo.scheduledTime;

//     if (scheduledTime) {
//       const [hours, minutes] = scheduledTime.split(":").map(Number);

//       taskDate.setHours(hours);
//       taskDate.setMinutes(minutes);
//       taskDate.setSeconds(0);
//       taskDate.setMilliseconds(0);
//     }

//     const now = new Date();

//     const isDelayed = taskDate <= now;

//     updatePayload.isDelayed = isDelayed;
//     updatePayload.notificationSent = isDelayed;

//     // Reset delay reason only if task is no longer delayed
//     if (!isDelayed) {
//       updatePayload.delayReason = "";
//       updatePayload.delayReasonSubmittedAt = null;
//     }
//   }

//   // ===========================
//   // Completed Status
//   // ===========================
//   if (updateData.status === "COMPLETED") {
//     updatePayload.completedAt = new Date();
//   } else if (updateData.status === "PENDING") {
//     updatePayload.completedAt = null;
//   }

//   // ===========================
//   // Delay Reason
//   // ===========================
//   if (updateData.delayReason?.trim()) {
//     updatePayload.delayReason = updateData.delayReason.trim();
//     updatePayload.isDelayed = true;
//     updatePayload.notificationSent = true;

//     if (!existingTodo.delayReasonSubmittedAt) {
//       updatePayload.delayReasonSubmittedAt = new Date();
//     }
//   }

//   const todo = await todoModel.findOneAndUpdate(
//     {
//       _id: todoId,
//       userId,
//       isDeleted: false,
//     },
//     updatePayload,
//     {
//       new: true,
//     },
//   );

//   await activitylogs.createActivity({
//     userId,
//     action: activityServicActions.UPDATE_TASK,
//     module: "TODO",
//     description: `${user.email} updated a todo task`,
//   });

//   return todo;
// };

const updateTodo = async (todoId, userId, updateData) => {
  const user = await User.findById(userId);

  const existingTodo = await todoModel.findOne({
    _id: todoId,
    userId,
    isDeleted: false,
  });

  if (!existingTodo) {
    throw new Error("Todo not found");
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

  // ===========================
  // Date / Time Changed
  // ===========================
  if (updateData.date || updateData.scheduledTime) {
    const taskDate = new Date(updateData.date || existingTodo.date);

    const scheduledTime =
      updateData.scheduledTime || existingTodo.scheduledTime;

    if (scheduledTime) {
      const [hours, minutes] = scheduledTime.split(":").map(Number);

      taskDate.setHours(hours);
      taskDate.setMinutes(minutes);
      taskDate.setSeconds(0);
      taskDate.setMilliseconds(0);
    }

    const now = new Date();

    const isDelayed = taskDate <= now;

    updatePayload.isDelayed = isDelayed;
    updatePayload.notificationSent = isDelayed;

    if (!isDelayed) {
      updatePayload.delayReason = "";
      updatePayload.delayReasonSubmittedAt = null;
    }
  }

  // ===========================
  // Task Status
  // ===========================

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
  }

  // CANCELLED
  else if (updateData.status === "CANCELLED") {
    if (!updateData.cancelReason?.trim()) {
      throw new Error("Cancellation reason is required");
    }

    updatePayload.cancelReason = updateData.cancelReason.trim();
    updatePayload.cancelledAt = new Date();

    updatePayload.completedAt = null;

    if (updateData.remarks !== undefined) {
      updatePayload.remarks = updateData.remarks;
    }
  }

  // ===========================
  // Delay Reason
  // ===========================
  if (updateData.delayReason?.trim()) {
    updatePayload.delayReason = updateData.delayReason.trim();

    updatePayload.isDelayed = true;
    updatePayload.notificationSent = true;

    if (!existingTodo.delayReasonSubmittedAt) {
      updatePayload.delayReasonSubmittedAt = new Date();
    }
  }

  const todo = await todoModel.findOneAndUpdate(
    {
      _id: todoId,
      userId,
      isDeleted: false,
    },
    updatePayload,
    {
      new: true,
    }
  );

  // ===========================
  // Activity Log
  // ===========================

  let activityDescription = `${user.email} updated a todo task`;

  if (updateData.status === "COMPLETED") {
    activityDescription = `${user.email} completed a todo task`;
  }

  if (updateData.status === "CANCELLED") {
    activityDescription = `${user.email} cancelled a todo task`;
  }

  if (updateData.status === "PENDING") {
    activityDescription = `${user.email} marked a todo as pending`;
  }

  await activitylogs.createActivity({
    userId,
    action: activityServicActions.UPDATE_TASK,
    module: "TODO",
    description: activityDescription,
  });

  return todo;
};

const deleteTodo = async (todoId, userId) => {
  const user = await User.findById(userId);
  const todo = await todoModel.findByIdAndUpdate(
    {
      _id: todoId,
      userId,
      isDeleted: false,
    },

    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
  await activitylogs.createActivity({
    userId: userId,
    action: activityServicActions.DELETE_TASK,
    module: "TODO",
    description: `${user.email} delete a todo task`,
  });
  return todo;
};

const todoCountByDate = async (userId) => {
  if (!userId) {
    throw new Error("User not found");
  }

  return await todoModel.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$date",
          },
        },
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

const getDashboard = async (userId, date) => {
  const startDate = new Date(date);

  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  const query = {
    userId,
    isDeleted: false,
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  };

  console.log("Dashboard Query =", query);

  const totalTasks = await todoModel.countDocuments(query);

  const completedTasks = await todoModel.countDocuments({
    ...query,
    status: "COMPLETED",
  });

  const pendingTasks = await todoModel.countDocuments({
    ...query,
    status: "PENDING",
  });

  const delayedTasks = await todoModel.countDocuments({
    ...query,
    isDelayed: true,
  });

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    delayedTasks,
    completionRate,
  };
};

// const todoListDate = async (userId, date, page, limit) => {
//   if (!userId) {
//     throw new Error("User not found");
//   }

//   const startDate = new Date(date);

//   const endDate = new Date(date);
//   endDate.setDate(endDate.getDate() + 1);

//   const query = {
//     userId,
//     isDeleted: false,
//     date: {
//       $gte: startDate,
//       $lt: endDate,
//     },
//   };

//   const skip = (page - 1) * limit;

//   const totalRecords = await todoModel.countDocuments(query);

//   const todos = await todoModel
//     .find(query)
//     .sort({ scheduledTime: 1 })
//     .skip(skip)
//     .limit(limit);

//   const user = await User.findById(userId);

//   await activitylogs.createActivity({
//     userId,
//     action: activityServicActions.DATE_TASK,
//     module: "DAILY INFO",
//     description: `${user.name} viewed todo for ${date}`,
//   });

//   return {
//     todos,
//     pagination: {
//       page,
//       limit,
//       totalRecords,
//       totalPages: Math.ceil(totalRecords / limit),
//       hasNextPage: page * limit < totalRecords,
//       hasPreviousPage: page > 1,
//     },
//   };
// };

module.exports = {
  createTodo,
  todoListDate,
  updateTodo,
  deleteTodo,
  todoList,
  todoCountByDate,
  getDashboard,
};
