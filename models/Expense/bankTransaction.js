const mongoose = require("mongoose");

const bankTransactionSchema = new mongoose.Schema(
  {
    /*
     * Owner of this transaction.
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    /*
     * Linked bank account from which
     * this transaction was fetched.
     */
    bankAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "linkedBankAccount",
      required: true,
      index: true,
    },

    /*
     * Unique transaction identifier
     * received from bank / AA provider.
     *
     * Used to prevent duplicate transactions.
     */
    providerTransactionId: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Transaction amount.
     *
     * Keep amount positive.
     * CREDIT / DEBIT is identified separately.
     */
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * CREDIT = money received
     * DEBIT  = money deducted
     */
    transactionType: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
      index: true,
    },

    /*
     * Original bank transaction description.
     *
     * Example:
     * UPI/SWIGGY/987654
     */
    description: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Merchant extracted from description.
     *
     * Example:
     * SWIGGY
     * AMAZON
     * UBER
     */
    merchantName: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Date when the actual transaction happened.
     */
    transactionDate: {
      type: Date,
      required: true,
      index: true,
    },

    /*
     * Payment method / transaction mode.
     *
     * Example:
     * UPI
     * CARD
     * NEFT
     * IMPS
     * RTGS
     * ATM
     */
    paymentMode: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Bank reference number if available.
     *
     * Example:
     * UTR / RRN / reference number.
     */
    referenceNumber: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Expense category used by your
     * expense sheet.
     *
     * Examples:
     * FOOD
     * SHOPPING
     * TRAVEL
     * UTILITIES
     * RENT
     */
    category: {
      type: String,
      default: "UNCATEGORIZED",
      trim: true,
      index: true,
    },

    /*
     * Not every debit should be counted
     * as an expense.
     *
     * Example:
     * Transfer between user's own accounts.
     */
    isExpense: {
      type: Boolean,
      default: false,
      index: true,
    },

    /*
     * Where category came from.
     *
     * AUTO   = system categorized
     * USER   = user manually changed category
     */
    categorySource: {
      type: String,
      enum: ["AUTO", "USER"],
      default: "AUTO",
    },

    /*
     * Useful later for identifying
     * transfers between own accounts.
     */
    isTransfer: {
      type: Boolean,
      default: false,
      index: true,
    },

    /*
     * Refund transactions can later be
     * linked with original expenses.
     */
    isRefund: {
      type: Boolean,
      default: false,
    },

    /*
     * Optional balance after transaction
     * if bank provider supplies it.
     */
    balanceAfterTransaction: {
      type: Number,
      default: null,
    },

    /*
     * Raw transaction status received
     * from provider if available.
     */
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
      default: "COMPLETED",
      index: true,
    },

    /*
     * Soft delete.
     */
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Prevent the same bank transaction
 * from being inserted again when
 * transaction history is synced repeatedly.
 */
bankTransactionSchema.index(
  {
    bankAccountId: 1,
    providerTransactionId: 1,
  },
  {
    unique: true,
  }
);

/*
 * Common query:
 *
 * Get user's expenses for a date range.
 */
bankTransactionSchema.index({
  userId: 1,
  isExpense: 1,
  isDeleted: 1,
  transactionDate: -1,
});

/*
 * Common query:
 *
 * Get transactions for one bank account.
 */
bankTransactionSchema.index({
  bankAccountId: 1,
  transactionDate: -1,
});

/*
 * Useful for category-wise monthly reports.
 */
bankTransactionSchema.index({
  userId: 1,
  category: 1,
  transactionDate: -1,
});

module.exports = mongoose.model(
  "bankTransaction",
  bankTransactionSchema
);