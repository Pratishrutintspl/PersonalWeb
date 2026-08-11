const bankTransactionService = require("../../services/Expense/bankTransaction.service");
const response = require("../../utils/response");
const message = require("../../constants/message");
/*
 * Helper because your auth middleware
 * may store user id as req.user.id or req.user._id.
 */
const getUserId = (req) => {
  return req.user?._id || req.user?.id;
};

/*
 * GET /bank-transactions
 */
const getBankTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await bankTransactionService.getBankTransactions({
      userId,
      query: req.query,
    });

    // return res.status(200).json({
    //   success: true,
    //   message:
    //     "Bank transactions fetched successfully",
    //   data: result.transactions,
    //   pagination: result.pagination,
    // });
    return response.SucessResponse(
      res,
      200,
      message.bankTranFetch,
      (data = result),
    );
  } catch (error) {
    console.log("Errorrrr--=-=-=", error);
    return response.errorResponse(res, 500, error.message, null);
  }
};

/*
 * GET /bank-transactions/:id
 */
const getBankTransactionById = async (req, res) => {
  try {
    const userId = getUserId(req);

    const transaction = await bankTransactionService.getBankTransactionById({
      userId,
      transactionId: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: "Bank transaction fetched successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("getBankTransactionById:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Transaction not found",
    });
  }
};

/*
 * PATCH /bank-transactions/:id/category
 */
const updateTransactionCategory = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { category } = req.body;

    const transaction = await bankTransactionService.updateTransactionCategory({
      userId,
      transactionId: req.params.id,
      category,
    });

    return res.status(200).json({
      success: true,
      message: "Transaction category updated successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("updateTransactionCategory:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update category",
    });
  }
};

/*
 * PATCH /bank-transactions/:id/expense
 *
 * Body:
 * {
 *   "isExpense": true
 * }
 */
const updateExpenseStatus = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { isExpense } = req.body;

    const transaction = await bankTransactionService.updateExpenseStatus({
      userId,
      transactionId: req.params.id,
      isExpense,
    });

    return res.status(200).json({
      success: true,
      message: "Expense status updated successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("updateExpenseStatus:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update expense status",
    });
  }
};

/*
 * DELETE /bank-transactions/:id
 */
const deleteBankTransaction = async (req, res) => {
  try {
    const userId = getUserId(req);

    await bankTransactionService.deleteBankTransaction({
      userId,
      transactionId: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("deleteBankTransaction:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete transaction",
    });
  }
};

module.exports = {
  getBankTransactions,
  getBankTransactionById,
  updateTransactionCategory,
  updateExpenseStatus,
  deleteBankTransaction,
};
