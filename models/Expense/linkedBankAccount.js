const mongoose = require("mongoose");

const linkedBankAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    /*
     * Account Aggregator / bank integration provider.
     *
     * Example:
     * "SETU"
     * "FINVU"
     * "ONEMONEY"
     *
     * Don't use this field for storing
     * net-banking credentials.
     */
    provider: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Account identifier received from
     * your financial-data provider.
     */
    providerAccountId: {
      type: String,
      required: true,
      trim: true,
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    accountType: {
      type: String,
      enum: ["SAVINGS", "CURRENT", "OTHER"],
      default: "SAVINGS",
    },

    /*
     * Never store the complete account number
     * unless you have a strong compliance reason.
     *
     * Example:
     * XXXX1234
     */
    maskedAccountNumber: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Is this account currently available
     * for transaction syncing?
     */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /*
     * Last successful transaction sync.
     */
    lastSyncedAt: {
      type: Date,
      default: null,
    },

    syncStatus: {
      type: String,
      enum: ["CONNECTED", "SYNCING", "FAILED", "DISCONNECTED"],
      default: "CONNECTED",
      index: true,
    },

    /*
     * When user disconnects the bank account.
     */
    disconnectedAt: {
      type: Date,
      default: null,
    },

    /*
     * Soft delete
     */
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    bankSyncEnabled: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * Prevent same provider account from
 * being connected multiple times
 * for the same user.
 */
linkedBankAccountSchema.index(
  {
    userId: 1,
    provider: 1,
    providerAccountId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

/*
 * Common query:
 *
 * Get user's active bank accounts.
 */
linkedBankAccountSchema.index({
  userId: 1,
  isDeleted: 1,
  isActive: 1,
});

module.exports = mongoose.model("linkedBankAccount", linkedBankAccountSchema);
