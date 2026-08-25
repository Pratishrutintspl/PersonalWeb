const todoService = require("../services/todoServices");
const response = require("../utils/response");
const message = require("../constants/message");

const checkDelayedTasks = async (req, res) => {
  try {
    const { date } = req.params;

    const userId =
      req.user?._id ||
      req.user?.id ||
      req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const delayedTasks =
      await todoService.checkDelayedTaskss(userId);

    return res.status(200).json({
      success: true,
      count: delayedTasks.length,
      data: delayedTasks,
    });
  } catch (error) {
    console.error("Check delayed tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check delayed tasks",
      error: error.message,
    });
  }
};
module.exports = {
  checkDelayedTasks,
};