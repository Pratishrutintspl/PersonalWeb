const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "expenseCategory",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    expenseDate: {
      type: Date,
      required: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    source: {
      type: String,
      enum: ["BANK", "MANUAL"],
      required: true,
      index: true,
    },

    /*
     * Filled only when expense came
     * from bank transaction.
     */
    bankTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bankTransaction",
      default: null,
    },

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

module.exports = mongoose.model(
  "expense",
  expenseSchema
);