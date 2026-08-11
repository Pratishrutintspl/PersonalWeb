const mongoose = require("mongoose");
const LinkedBankAccount = require("../../models/Expense/linkedBankAccount");

/**
 * Create / save linked bank account
 */
const createBankAccount = async (
  userId,
  payload
) => {
    console.log(userId, payload)
  if (!userId) {
    throw new Error("User not found");
  }
console.log("==============")
  const {
    provider,
    providerAccountId,
    bankName,
    accountType,
    maskedAccountNumber,
  } = payload;

  if (!provider?.trim()) {
    throw new Error("Provider is required");
  }

  if (!providerAccountId?.trim()) {
    throw new Error(
      "Provider account id is required"
    );
  }

  /*
   * Find existing account even if disconnected.
   */
  const existingAccount =
    await LinkedBankAccount.findOne({
      userId,
      provider: provider.trim(),
      providerAccountId:
        providerAccountId.trim(),
      isDeleted: false,
    });

  if (existingAccount) {
    /*
     * Reconnect if necessary.
     */
    if (
      !existingAccount.isActive ||
      existingAccount.syncStatus ===
        "DISCONNECTED"
    ) {
      existingAccount.isActive = true;
      existingAccount.syncStatus =
        "CONNECTED";

      existingAccount.disconnectedAt =
        null;

      existingAccount.bankName =
        bankName ||
        existingAccount.bankName;

      existingAccount.accountType =
        accountType ||
        existingAccount.accountType;

      existingAccount.maskedAccountNumber =
        maskedAccountNumber ||
        existingAccount.maskedAccountNumber;

      await existingAccount.save();
    }

    return existingAccount;
  }

  return LinkedBankAccount.create({
    userId,

    provider:
      provider.trim(),

    providerAccountId:
      providerAccountId.trim(),

    bankName:
      bankName?.trim() || "",

    accountType:
      accountType || "SAVINGS",

    maskedAccountNumber:
      maskedAccountNumber?.trim() || "",

    isActive: true,

    syncStatus:
      "CONNECTED",

    lastSyncedAt: null,

    disconnectedAt: null,

    isDeleted: false,

    deletedAt: null,
  });
};

/**
 * Get all user's linked bank accounts
 */
const getBankAccounts = async (userId) => {
  if (!userId) {
    throw new Error("User not found");
  }

  const accounts =
    await LinkedBankAccount.find({
      userId,
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });

  return accounts;
};

/**
 * Get single bank account
 */
const getBankAccountById = async (
  userId,
  accountId
) => {
  if (!userId) {
    throw new Error("User not found");
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      accountId
    )
  ) {
    throw new Error(
      "Invalid bank account id"
    );
  }

  const account =
    await LinkedBankAccount.findOne({
      _id: accountId,
      userId,
      isDeleted: false,
    });

  if (!account) {
    throw new Error(
      "Bank account not found"
    );
  }

  return account;
};

/**
 * Update linked bank account
 */
const updateBankAccount = async (
  userId,
  accountId,
  payload
) => {
  if (!userId) {
    throw new Error("User not found");
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      accountId
    )
  ) {
    throw new Error(
      "Invalid bank account id"
    );
  }

  const allowedFields = [
    "bankName",
    "accountType",
    "maskedAccountNumber",
    "isActive",
    "syncStatus",
    "lastSyncedAt",
  ];

  const updateData = {};

  allowedFields.forEach((field) => {
    if (
      payload[field] !== undefined
    ) {
      updateData[field] =
        payload[field];
    }
  });

  const updatedAccount =
    await LinkedBankAccount.findOneAndUpdate(
      {
        _id: accountId,
        userId,
        isDeleted: false,
      },
      {
        $set: updateData,
      },
      {
        new: true,
      }
    );

  if (!updatedAccount) {
    throw new Error(
      "Bank account not found"
    );
  }

  return updatedAccount;
};

/**
 * Mark account sync started
 */
const markSyncing = async (
  userId,
  accountId
) => {
  return updateBankAccount(
    userId,
    accountId,
    {
      syncStatus: "SYNCING",
    }
  );
};

/**
 * Mark sync success
 */
const markSyncSuccess = async (
  userId,
  accountId
) => {
  return updateBankAccount(
    userId,
    accountId,
    {
      syncStatus: "CONNECTED",
      lastSyncedAt: new Date(),
    }
  );
};

/**
 * Mark sync failed
 */
const markSyncFailed = async (
  userId,
  accountId
) => {
  return updateBankAccount(
    userId,
    accountId,
    {
      syncStatus: "FAILED",
    }
  );
};

/**
 * Disconnect bank account
 *
 * We are not deleting it physically.
 */
const disconnectBankAccount =
  async (
    userId,
    accountId
  ) => {
    if (!userId) {
      throw new Error(
        "User not found"
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        accountId
      )
    ) {
      throw new Error(
        "Invalid bank account id"
      );
    }

    const account =
      await LinkedBankAccount.findOneAndUpdate(
        {
          _id: accountId,
          userId,
          isDeleted: false,
        },
        {
          $set: {
            isActive: false,
            syncStatus:
              "DISCONNECTED",
            disconnectedAt:
              new Date(),
          },
        },
        {
          new: true,
        }
      );

    if (!account) {
      throw new Error(
        "Bank account not found"
      );
    }

    return account;
  };

/**
 * Soft delete bank account
 */
const deleteBankAccount = async (
  userId,
  accountId
) => {
  if (!userId) {
    throw new Error(
      "User not found"
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      accountId
    )
  ) {
    throw new Error(
      "Invalid bank account id"
    );
  }

  const account =
    await LinkedBankAccount.findOneAndUpdate(
      {
        _id: accountId,
        userId,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          isActive: false,
          syncStatus:
            "DISCONNECTED",
          deletedAt: new Date(),
        },
      },
      {
        new: true,
      }
    );

  if (!account) {
    throw new Error(
      "Bank account not found"
    );
  }

  return account;
};

module.exports = {
  createBankAccount,
  getBankAccounts,
  getBankAccountById,
  updateBankAccount,

  markSyncing,
  markSyncSuccess,
  markSyncFailed,

  disconnectBankAccount,
  deleteBankAccount,
};