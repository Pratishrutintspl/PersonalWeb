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
const getExpenses = async (
  req,
  res
) => {
  try {
    const userId =
      getUserId(req);

    const result =
      await expenseService.getExpenses({
        userId,
        query: req.query,
      });

    return response.SucessResponse(
      res,
      200,
      message.expenseFetched,
      {
        month:
          result.month,

        startDate:
          result.startDate,

        endDate:
          result.endDate,

        totalAmount:
          result.totalAmount,

        expenses:
          result.expenses,

        pagination:
          result.pagination,
      }
    );
  } catch (error) {
    console.error(
      "Get Expenses Error:",
      error
    );

    return response.errorResponse(
      res,
      error.statusCode || 500,
      error.message,
      null
    );
  }
};
const getExpenseByDate = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    const { date } = req.query;

    const result =
      await expenseService.getExpenseByDatee({
        userId,
        date,
      });

    return response.SucessResponse(
      res,
      200,
      message.expenseFetched,
      {
        date: result.date,

        totalAmount:
          result.totalAmount,

        totalExpenses:
          result.totalExpenses,

        expenses:
          result.expenses,
      }
    );
    
  } catch (error) {
    console.log(
      "Get expense by date error:",
      error
    );

    return response.errorResponse(
      res,
      error.statusCode || 500,
      error.message,
      null
    );
  }
};
/*
 * GET /expenses/:id
 */
const getExpenseById = async (req, res) => {
  try {
    const userId = getUserId(req);

    console.log(
      "Expense ID:",
      req.params.id
    );

    const expense =
      await expenseService.getExpenseByIdd({
        userId,
        expenseId: req.params.id,
      });

    console.log(
      "EXPENSE--------",
      expense
    );

    return response.SucessResponse(
      res,
      200,
      message.expenseFetched,
      expense
    );
  } catch (error) {
    console.error(
      "getExpenseById:",
      error
    );

    return response.errorResponse(
      res,
      error.statusCode || 500,
      error.message,
      null
    );
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

    // return res.status(200).json({
    //   success: true,
    //   message: "Expense updated successfully",
    //   data: expense,
    //   statusCode: 200,
    // });
    
    return response.SucessResponse(
      res,
      200,
      message.expenseUpdated,
      expense
    );
  } catch (error) {
    console.error("updateExpense:", error);


   return response.errorResponse(
      res,
      error.statusCode || 500,
      error.message,
      null
    );
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

  return response.SucessResponse(
      res,
      200,
      message.expenseDeleted,
      null
    );
  } catch (error) {
    console.error("deleteExpense:", error);



  
    return response.errorResponse(
      res,
      error.statusCode || 500,
      error.message,
      null
    );
  }
};

const getExpenseCountByDate = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result =
      await expenseService.expenseCountByDate(
        userId
      );
console.log(  "expenseCountByDate result:", result);
    return response.SucessResponse(
      res,
      200,
      message.expenseFetched,
      result
    );
  } catch (error) {
    console.log(
      "expenseCountByDate error:",
      error
    );

    return response.errorResponse(
      res,
      500,
      error.message,
      null
    );
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseByDate,
  getExpenseCountByDate,
};
