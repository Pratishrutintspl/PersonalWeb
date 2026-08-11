const mongoose = require("mongoose");
const BankTransaction = require("../../models/Expense/bankTransaction");
const LinkedBankAccount = require("../../models/Expense/linkedBankAccount");

/*
 * Verify that the bank account belongs to the user.
 */
const validateBankAccount = async (userId, bankAccountId) => {
  if (!mongoose.Types.ObjectId.isValid(bankAccountId)) {
    throw new Error("Invalid bank account id");
  }

  const bankAccount = await LinkedBankAccount.findOne({
    _id: bankAccountId,
    userId,
    isDeleted: false,
  });

  if (!bankAccount) {
    throw new Error("Bank account not found");
  }

  return bankAccount;
};

/*
 * Used internally while syncing transactions
 * from bank / Account Aggregator.
 *
 * Do not normally expose this directly
 * as a user POST API.
 */
const upsertBankTransaction = async ({
  userId,
  bankAccountId,
  transaction,
}) => {
  await validateBankAccount(userId, bankAccountId);

  if (!transaction.providerTransactionId) {
    throw new Error("Provider transaction id is required");
  }

  const existingTransaction = await BankTransaction.findOne({
    bankAccountId,
    providerTransactionId: transaction.providerTransactionId,
  });

  /*
   * Important:
   * If user manually changed category,
   * bank re-sync should not overwrite it.
   */
  const updateData = {
    userId,
    bankAccountId,

    providerTransactionId:
      transaction.providerTransactionId,

    amount: transaction.amount,

    transactionType:
      transaction.transactionType,

    description:
      transaction.description || "",

    merchantName:
      transaction.merchantName || "",

    transactionDate:
      transaction.transactionDate,

    paymentMode:
      transaction.paymentMode || "",

    referenceNumber:
      transaction.referenceNumber || "",

    isTransfer:
      transaction.isTransfer || false,

    isRefund:
      transaction.isRefund || false,

    balanceAfterTransaction:
      transaction.balanceAfterTransaction ?? null,

    status:
      transaction.status || "COMPLETED",
  };

  /*
   * Only update automatic categorization
   * when user hasn't manually overridden it.
   */
  if (
    !existingTransaction ||
    existingTransaction.categorySource !== "USER"
  ) {
    updateData.category =
      transaction.category || "UNCATEGORIZED";

    updateData.isExpense =
      transaction.isExpense ?? false;

    updateData.categorySource = "AUTO";
  }

  const savedTransaction =
    await BankTransaction.findOneAndUpdate(
      {
        bankAccountId,
        providerTransactionId:
          transaction.providerTransactionId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

  return savedTransaction;
};

/*
 * Get all transactions of logged-in user.
 *
 * Supports:
 * bankAccountId
 * transactionType
 * category
 * isExpense
 * startDate
 * endDate
 * pagination
 */
const getBankTransactions = async ({
  userId,
  query,
}) => {
  const {
    bankAccountId,
    transactionType,
    category,
    isExpense,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = query;

  const filter = {
    userId,
    isDeleted: false,
  };

  if (bankAccountId) {
    if (!mongoose.Types.ObjectId.isValid(bankAccountId)) {
      throw new Error("Invalid bank account id");
    }

    filter.bankAccountId = bankAccountId;
  }

  if (transactionType) {
    filter.transactionType = transactionType;
  }

  if (category) {
    filter.category = category;
  }

  if (isExpense !== undefined) {
    filter.isExpense =
      String(isExpense).toLowerCase() === "true";
  }

  if (startDate || endDate) {
    filter.transactionDate = {};

    if (startDate) {
      filter.transactionDate.$gte =
        new Date(startDate);
    }

    if (endDate) {
      const date = new Date(endDate);

      /*
       * Include entire end date.
       */
      date.setHours(23, 59, 59, 999);

      filter.transactionDate.$lte = date;
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

  const [transactions, total] =
    await Promise.all([
      BankTransaction.find(filter)
        .populate(
          "bankAccountId",
          "bankName maskedAccountNumber accountType provider"
        )
        .sort({
          transactionDate: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),

      BankTransaction.countDocuments(filter),
    ]);

  return {
    transactions,

    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages:
        Math.ceil(total / parsedLimit),
    },
  };
};

/*
 * Get one transaction.
 */
const getBankTransactionById = async ({
  userId,
  transactionId,
}) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new Error("Invalid transaction id");
  }

  const transaction =
    await BankTransaction.findOne({
      _id: transactionId,
      userId,
      isDeleted: false,
    })
      .populate(
        "bankAccountId",
        "bankName maskedAccountNumber accountType provider"
      )
      .lean();

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

/*
 * User manually changes expense category.
 */
const updateTransactionCategory = async ({
  userId,
  transactionId,
  category,
}) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new Error("Invalid transaction id");
  }

  if (!category || !category.trim()) {
    throw new Error("Category is required");
  }

  const transaction =
    await BankTransaction.findOneAndUpdate(
      {
        _id: transactionId,
        userId,
        isDeleted: false,
      },
      {
        $set: {
          category:
            category.trim().toUpperCase(),

          /*
           * Prevent future automatic sync
           * from overwriting user's selection.
           */
          categorySource: "USER",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

/*
 * User can include/exclude a transaction
 * from expense calculation.
 */
const updateExpenseStatus = async ({
  userId,
  transactionId,
  isExpense,
}) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new Error("Invalid transaction id");
  }

  if (typeof isExpense !== "boolean") {
    throw new Error(
      "isExpense must be true or false"
    );
  }

  const transaction =
    await BankTransaction.findOneAndUpdate(
      {
        _id: transactionId,
        userId,
        isDeleted: false,
      },
      {
        $set: {
          isExpense,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

/*
 * Soft delete.
 *
 * Usually you should rarely delete bank transactions.
 * You may instead hide/exclude them from expenses.
 */
const deleteBankTransaction = async ({
  userId,
  transactionId,
}) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new Error("Invalid transaction id");
  }

  const transaction =
    await BankTransaction.findOneAndUpdate(
      {
        _id: transactionId,
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

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

module.exports = {
  upsertBankTransaction,
  getBankTransactions,
  getBankTransactionById,
  updateTransactionCategory,
  updateExpenseStatus,
  deleteBankTransaction,
};