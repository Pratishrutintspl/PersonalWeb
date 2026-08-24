const mongoose = require("mongoose");

const Expense = require("../../models/Expense/expense");

const ExpenseCategory = require("../../models/Expense/expenseCategory");

const validateCategory = async (userId, categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error("Invalid category id");
    error.statusCode = 400;
    throw error;
  }

  const category = await ExpenseCategory.findOne({
    _id: categoryId,

    /*
     * Remove userId condition if your
     * categories are global/master categories.
     */
    // userId,

    isDeleted: false,
    isActive: true,
  });

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  return category;
};

/*
 * Create manual expense
 */
const createExpense = async ({ userId, data }) => {
  const {
    categoryId,
    amount,
    expenseDate,
    description,
    source = "MANUAL",
    bankTransactionId,
    paymentMethod,
  } = data;

  // =========================================
  // CATEGORY VALIDATION
  // =========================================

  if (!categoryId) {
    const error = new Error("Category is required");
    error.statusCode = 400;
    throw error;
  }

  // =========================================
  // AMOUNT VALIDATION
  // =========================================

  if (amount === undefined || amount === null || Number(amount) <= 0) {
    const error = new Error("Amount must be greater than 0");

    error.statusCode = 400;
    throw error;
  }

  // =========================================
  // DATE VALIDATION
  // Expected format: YYYY-MM-DD
  // Example: 2026-08-19
  // =========================================

  if (!expenseDate) {
    const error = new Error("Expense date is required");

    error.statusCode = 400;
    throw error;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(expenseDate)) {
    const error = new Error("Expense date must be in YYYY-MM-DD format");

    error.statusCode = 400;
    throw error;
  }

  // =========================================
  // SOURCE VALIDATION
  // =========================================

  if (!["MANUAL", "BANK"].includes(source)) {
    const error = new Error("Invalid expense source");

    error.statusCode = 400;
    throw error;
  }

  // =========================================
  // BANK VALIDATION
  // =========================================

  if (source === "BANK" && !bankTransactionId) {
    const error = new Error("Bank transaction is required");

    error.statusCode = 400;
    throw error;
  }

  // =========================================
  // CATEGORY CHECK
  // =========================================

  await validateCategory(userId, categoryId);

  // =========================================
  // CREATE EXPENSE
  // =========================================

  const expense = await Expense.create({
    userId,

    categoryId,

    amount: Number(amount),

    // Keep string directly
    // Example: "2026-08-19"
    expenseDate,

    description: description?.trim() || "",

    source,

    // Only save for BANK
    bankTransactionId: source === "BANK" ? bankTransactionId : null,

    // Only save for MANUAL
    paymentMethod: source === "MANUAL" ? paymentMethod || null : null,
  });

  return expense;
};

/*
 * Get user's expenses
 *
 * Supports:
 * categoryId
 * source
 * startDate
 * endDate
 * page
 * limit
 */
const getExpenses = async ({ userId, query }) => {
  const { categoryId, source, month, page = 1, limit = 20 } = query;

  const filter = {
    userId,
    isDeleted: false,
  };

  // =========================================
  // CATEGORY FILTER
  // =========================================

  if (categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      const error = new Error("Invalid category id");

      error.statusCode = 400;
      throw error;
    }

    filter.categoryId = categoryId;
  }

  // =========================================
  // SOURCE FILTER
  // =========================================

  if (source) {
    const normalizedSource = source.toUpperCase();

    if (!["MANUAL", "BANK"].includes(normalizedSource)) {
      const error = new Error("Invalid expense source");

      error.statusCode = 400;
      throw error;
    }

    filter.source = normalizedSource;
  }

  // =========================================
  // MONTH FILTER
  //
  // Default:
  // Current month
  //
  // Optional:
  // ?month=2026-08
  // =========================================

  let selectedMonth = month;

  if (!selectedMonth) {
    const now = new Date();

    const year = now.getFullYear();

    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

    selectedMonth = `${year}-${currentMonth}`;
  }

  // =========================================
  // VALIDATE MONTH
  // Expected: YYYY-MM
  // =========================================

  const monthRegex = /^\d{4}-\d{2}$/;

  if (!monthRegex.test(selectedMonth)) {
    const error = new Error("Month must be in YYYY-MM format");

    error.statusCode = 400;
    throw error;
  }

  const [year, monthNumber] = selectedMonth.split("-").map(Number);

  if (monthNumber < 1 || monthNumber > 12) {
    const error = new Error("Invalid month");

    error.statusCode = 400;
    throw error;
  }

  // =========================================
  // GET FIRST & LAST DAY OF MONTH
  // =========================================

  const lastDay = new Date(year, monthNumber, 0).getDate();

  const startDate = `${selectedMonth}-01`;

  const endDate = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

  // =========================================
  // APPLY MONTH FILTER
  // =========================================

  filter.expenseDate = {
    $gte: startDate,
    $lte: endDate,
  };

  console.log("Expense month filter:", {
    selectedMonth,
    startDate,
    endDate,
  });

  // =========================================
  // PAGINATION
  // =========================================

  const parsedPage = Math.max(Number(page) || 1, 1);

  const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const skip = (parsedPage - 1) * parsedLimit;

  // =========================================
  // FETCH EXPENSES
  // =========================================

  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .populate("categoryId")
      .populate("bankTransactionId")
      .sort({
        expenseDate: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),

    Expense.countDocuments(filter),
  ]);

  // =========================================
  // TOTAL EXPENSE AMOUNT
  // =========================================

  const totalAmount = await Expense.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: null,
        totalAmount: {
          $sum: "$amount",
        },
      },
    },
  ]);

  return {
    month: selectedMonth,

    startDate,

    endDate,

    totalAmount: totalAmount[0]?.totalAmount || 0,

    expenses,

    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,

      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

const updateExpense = async ({ userId, expenseId, data }) => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    const error = new Error("Invalid expense id");
    error.statusCode = 400;
    throw error;
  }

  const expense = await Expense.findOne({
    _id: expenseId,
    userId,
    isDeleted: false,
  });

  if (!expense) {
    const error = new Error("Expense not found");
    error.statusCode = 404;
    throw error;
  }

  /*
   * Don't directly modify bank-created
   * expenses through manual CRUD.
   */
  if (expense.source === "BANK") {
    const error = new Error(
      "Bank expense cannot be edited through manual expense API",
    );
    error.statusCode = 400;
    throw error;
  }

  if (data.categoryId) {
    await validateCategory(userId, data.categoryId);

    expense.categoryId = data.categoryId;
  }

  if (data.amount !== undefined) {
    if (Number(data.amount) <= 0) {
      const error = new Error("Amount must be greater than 0");
      error.statusCode = 400;
      throw error;
    }

    expense.amount = Number(data.amount);
  }
  if (data.expenseDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(data.expenseDate)) {
      const error = new Error("Expense date must be in YYYY-MM-DD format");

      error.statusCode = 400;
      throw error;
    }

    expense.expenseDate = data.expenseDate;
  }
  if (data.paymentMethod !== undefined) {
    expense.paymentMethod = data.paymentMethod || null;
  }
  if (data.description !== undefined) {
    expense.description = data.description?.trim() || "";
  }

  await expense.save();

  return expense;
};

const deleteExpense = async ({ userId, expenseId }) => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    const error = new Error("Invalid expense id");
    error.statusCode = 400;
    throw error;
  }

  const expense = await Expense.findOne({
    _id: expenseId,
    userId,
    isDeleted: false,
  });

  if (!expense) {
    const error = new Error("Expense not found");
    error.statusCode = 404;
    throw error;
  }

  if (expense.source === "BANK") {
    const error = new Error(
      "Bank expense cannot be deleted through manual expense API",
    );
    error.statusCode = 400;
    throw error;
  }

  expense.isDeleted = true;
  expense.deletedAt = new Date();

  await expense.save();

  return expense;
};
const getExpenseByDatee = async ({ userId, date }) => {
  // =========================================
  // DATE REQUIRED
  // =========================================

  if (!date) {
    const error = new Error("Expense date is required");

    error.statusCode = 400;
    throw error;
  }

  // =========================================
  // DATE FORMAT VALIDATION
  // Expected: YYYY-MM-DD
  // Example: 2026-08-19
  // =========================================

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(date)) {
    const error = new Error("Date must be in YYYY-MM-DD format");

    error.statusCode = 400;
    throw error;
  }

  // =========================================
  // GET EXPENSES
  // =========================================

  const expenses = await Expense.find({
    userId,
    expenseDate: date,
    isDeleted: false,
  })
    .populate("categoryId")
    .populate("bankTransactionId")
    .sort({
      createdAt: -1,
    })
    .lean();

  // =========================================
  // TOTAL AMOUNT
  // =========================================

  const totalAmount = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );

  return {
    date,
    totalAmount,
    totalExpenses: expenses.length,
    expenses,
  };
};

const expenseCountByDate = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user");
  }

  const objectId = new mongoose.Types.ObjectId(userId);

  const result = await Expense.aggregate([
    // ============================================
    // USER EXPENSES ONLY
    // ============================================
    {
      $match: {
        userId: objectId,
        isDeleted: false,
      },
    },

    // ============================================
    // NORMALIZE expenseDate
    // ============================================
    {
      $addFields: {
        normalizedDate: {
          $switch: {
            branches: [
              // MongoDB Date
              {
                case: {
                  $eq: [
                    {
                      $type: "$expenseDate",
                    },
                    "date",
                  ],
                },

                then: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$expenseDate",
                    timezone: "Asia/Kolkata",
                  },
                },
              },

              // String date
              {
                case: {
                  $eq: [
                    {
                      $type: "$expenseDate",
                    },
                    "string",
                  ],
                },

                then: {
                  $substrBytes: ["$expenseDate", 0, 10],
                },
              },
            ],

            default: null,
          },
        },
      },
    },

    // ============================================
    // REMOVE INVALID DATES
    // ============================================
    {
      $match: {
        normalizedDate: {
          $ne: null,
        },
      },
    },

    // ============================================
    // COUNT BY DATE
    // ============================================
    {
      $group: {
        _id: "$normalizedDate",

        count: {
          $sum: 1,
        },
      },
    },

    // ============================================
    // RESPONSE
    // ============================================
    {
      $project: {
        _id: 0,

        date: "$_id",

        count: 1,
      },
    },

    // ============================================
    // DATE ASCENDING
    // ============================================
    {
      $sort: {
        date: 1,
      },
    },
  ]);

  console.log("Expense calendar count:", result);

  return result;
};
const getExpenseByIdd = async ({ userId, expenseId }) => {
  console.log("getExpenseById called with:", {
    userId,
    expenseId,
  });
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    const error = new Error("Invalid expense id");

    error.statusCode = 400;
    throw error;
  }

  const expense = await Expense.findOne({
    _id: expenseId,
    userId,
    isDeleted: false,
  })
    .populate("categoryId")
    .populate("bankTransactionId")
    .lean();

  if (!expense) {
    const error = new Error("Expense not found");

    error.statusCode = 404;
    throw error;
  }

  return expense;
};
module.exports = {
  createExpense,
  getExpenses,
  getExpenseByIdd,
  updateExpense,
  deleteExpense,
  getExpenseByDatee,
  expenseCountByDate,
};
