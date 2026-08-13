const mongoose = require("mongoose");

const Expense = require(
  "../../models/Expense/expense"
);

const ExpenseCategory = require(
  "../../models/Expense/expenseCategory"
);


const validateCategory = async (
  userId,
  categoryId
) => {
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
const createExpense = async ({
  userId,
  data,
}) => {
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

  if (
    amount === undefined ||
    amount === null ||
    Number(amount) <= 0
  ) {
    const error = new Error(
      "Amount must be greater than 0",
    );

    error.statusCode = 400;
    throw error;
  }

  // =========================================
  // DATE VALIDATION
  // =========================================

  if (!expenseDate) {
    const error = new Error(
      "Expense date is required",
    );

    error.statusCode = 400;
    throw error;
  }

  // =========================================
  // SOURCE VALIDATION
  // =========================================

  if (!["MANUAL", "BANK"].includes(source)) {
    const error = new Error(
      "Invalid expense source",
    );

    error.statusCode = 400;
    throw error;
  }

  // =========================================
  // BANK VALIDATION
  // =========================================

  if (
    source === "BANK" &&
    !bankTransactionId
  ) {
    const error = new Error(
      "Bank transaction is required",
    );

    error.statusCode = 400;
    throw error;
  }

  // =========================================
  // CATEGORY CHECK
  // =========================================

  await validateCategory(
    userId,
    categoryId,
  );

  // =========================================
  // CREATE EXPENSE
  // =========================================

  const expense = await Expense.create({
    userId,

    categoryId,

    amount: Number(amount),

    expenseDate: new Date(expenseDate),

    description:
      description?.trim() || "",

    // IMPORTANT
    source,

    // Only save for BANK
    bankTransactionId:
      source === "BANK"
        ? bankTransactionId
        : null,

    // Only save paymentMethod for MANUAL
    paymentMethod:
      source === "MANUAL"
        ? paymentMethod || null
        : null,
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
const getExpenses = async ({
  userId,
  query,
}) => {
  const {
    categoryId,
    source,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = query;

  const filter = {
    userId,
    isDeleted: false,
  };

  if (categoryId) {
    if (
      !mongoose.Types.ObjectId.isValid(
        categoryId
      )
    ) {
      const error = new Error(
        "Invalid category id"
      );
      error.statusCode = 400;
      throw error;
    }

    filter.categoryId = categoryId;
  }

  if (source) {
    const normalizedSource =
      source.toUpperCase();

    if (
      !["MANUAL", "BANK"].includes(
        normalizedSource
      )
    ) {
      const error = new Error(
        "Invalid expense source"
      );
      error.statusCode = 400;
      throw error;
    }

    filter.source = normalizedSource;
  }

  if (startDate || endDate) {
    filter.expenseDate = {};

    if (startDate) {
      filter.expenseDate.$gte =
        new Date(startDate);
    }

    if (endDate) {
      const date = new Date(endDate);

      date.setHours(
        23,
        59,
        59,
        999
      );

      filter.expenseDate.$lte = date;
    }
  }

  const parsedPage = Math.max(
    Number(page) || 1,
    1
  );

  const parsedLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const skip =
    (parsedPage - 1) * parsedLimit;

  const [expenses, total] =
    await Promise.all([
      Expense.find(filter)
        .populate(
          "categoryId"
          // Add fields depending on category schema:
          // "name icon color"
        )
        .populate(
          "bankTransactionId"
        )
        .sort({
          expenseDate: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),

      Expense.countDocuments(filter),
    ]);

  return {
    expenses,

    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,

      totalPages: Math.ceil(
        total / parsedLimit
      ),
    },
  };
};

/*
 * Get expense by id
 */
const getExpenseById = async ({
  userId,
  expenseId,
}) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      expenseId
    )
  ) {
    const error = new Error(
      "Invalid expense id"
    );
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
    const error = new Error(
      "Expense not found"
    );
    error.statusCode = 404;
    throw error;
  }

  return expense;
};

/*
 * Update manual expense.
 *
 * For now bank-generated expenses are
 * not edited through this endpoint.
 */
const updateExpense = async ({
  userId,
  expenseId,
  data,
}) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      expenseId
    )
  ) {
    const error = new Error(
      "Invalid expense id"
    );
    error.statusCode = 400;
    throw error;
  }

  const expense = await Expense.findOne({
    _id: expenseId,
    userId,
    isDeleted: false,
  });

  if (!expense) {
    const error = new Error(
      "Expense not found"
    );
    error.statusCode = 404;
    throw error;
  }

  /*
   * Don't directly modify bank-created
   * expenses through manual CRUD.
   */
  if (expense.source === "BANK") {
    const error = new Error(
      "Bank expense cannot be edited through manual expense API"
    );
    error.statusCode = 400;
    throw error;
  }

  if (data.categoryId) {
    await validateCategory(
      userId,
      data.categoryId
    );

    expense.categoryId =
      data.categoryId;
  }

  if (data.amount !== undefined) {
    if (Number(data.amount) <= 0) {
      const error = new Error(
        "Amount must be greater than 0"
      );
      error.statusCode = 400;
      throw error;
    }

    expense.amount =
      Number(data.amount);
  }

  if (data.expenseDate) {
    expense.expenseDate =
      new Date(data.expenseDate);
  }

  if (
    data.description !== undefined
  ) {
    expense.description =
      data.description?.trim() || "";
  }

  await expense.save();

  return expense;
};

/*
 * Soft delete manual expense
 */
const deleteExpense = async ({
  userId,
  expenseId,
}) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      expenseId
    )
  ) {
    const error = new Error(
      "Invalid expense id"
    );
    error.statusCode = 400;
    throw error;
  }

  const expense = await Expense.findOne({
    _id: expenseId,
    userId,
    isDeleted: false,
  });

  if (!expense) {
    const error = new Error(
      "Expense not found"
    );
    error.statusCode = 404;
    throw error;
  }

  if (expense.source === "BANK") {
    const error = new Error(
      "Bank expense cannot be deleted through manual expense API"
    );
    error.statusCode = 400;
    throw error;
  }

  expense.isDeleted = true;
  expense.deletedAt = new Date();

  await expense.save();

  return expense;
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};