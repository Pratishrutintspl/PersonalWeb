const expenseService = require("../../services/Expense/expense.service");
const response = require("../../utils/response");
const message = require("../../constants/message");

const getUserId = (req) => {
  return req.user.userId || req.user?.id;
};

/*
 * POST /expenses
 */
const createExpense = async (req, res) => {
  try {
    const userId = getUserId(req);

    const expense = await expenseService.createExpense({
      userId,
      data: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
      statusCode: 201,
    });
  } catch (error) {
    console.error("createExpense:", error);

    const statusCode = error.statusCode || 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to create expense",
      statusCode,
    });
  }
};

/*
 * GET /expenses
 */
const getExpenses = async (req, res) => {
  try {
    const userId = getUserId(req);

    const result = await expenseService.getExpenses({
      userId,
      query: req.query,
    });

    // return res.status(200).json({
    //   success: true,
    //   message:
    //     "Expenses fetched successfully",

    //   data: {
    //     expenses:
    //       result.expenses,

    //     pagination:
    //       result.pagination,
    //   },

    //   statusCode: 200,
    // });

    return response.SucessResponse(
      res,
      200,
      message.expenseFetched,
    
      data= {
        expenses:
          result.expenses,

        pagination:
          result.pagination,
      },
    );
  } catch (error) {
    console.log("Errorrrr--=-=-=", error);
    return response.errorResponse(res, 500, error.message, null);
  }
};

/*
 * GET /expenses/:id
 */
const getExpenseById = async (req, res) => {
  try {
    const userId = getUserId(req);

    const expense = await expenseService.getExpenseById({
      userId,
      expenseId: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: "Expense fetched successfully",
      data: expense,
      statusCode: 200,
    });
  } catch (error) {
    console.error("getExpenseById:", error);

    const statusCode = error.statusCode || 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch expense",
      statusCode,
    });
  }
};

/*
 * PUT /expenses/:id
 */
const updateExpense = async (req, res) => {
  try {
    const userId = getUserId(req);

    const expense = await expenseService.updateExpense({
      userId,
      expenseId: req.params.id,
      data: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
      statusCode: 200,
    });
  } catch (error) {
    console.error("updateExpense:", error);

    const statusCode = error.statusCode || 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update expense",
      statusCode,
    });
  }
};

/*
 * DELETE /expenses/:id
 */
const deleteExpense = async (req, res) => {
  try {
    const userId = getUserId(req);

    await expenseService.deleteExpense({
      userId,
      expenseId: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      statusCode: 200,
    });
  } catch (error) {
    console.error("deleteExpense:", error);

    const statusCode = error.statusCode || 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete expense",
      statusCode,
    });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
