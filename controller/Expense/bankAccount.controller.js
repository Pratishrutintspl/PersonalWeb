const bankAccountService = require("../../services/Expense/bankAccount.service");
const response = require("../../utils/response");
const message = require("../../constants/message");
/**
 * Create / connect bank account
 * POST /api/bank-accounts
 */
const createBankAccount = async (req, res, next) => {
  try {
    console.log(req.user);
    const userId = req.user.userId;

    const result = await bankAccountService.createBankAccount(userId, req.body);

    return response.SucessResponse(
      res,
      200,
      message.bankConnected,
      (data = result),
    );
  } catch (error) {
    console.log("Errorrrr--=-=-=", error);
    return response.errorResponse(res, 500, error.message, null);
  }
};

/**
 * Get all connected bank accounts
 * GET /api/bank-accounts
 */
const getBankAccounts = async (req, res, next) => {
  try {
    console.log("===============req.user", req.user);
    const userId = req.user.userId;
    console.log("===============userId", userId);
    const result = await bankAccountService.getBankAccounts(userId);

    // return res.status(200).json({
    //   success: true,
    //   message: "Bank accounts fetched successfully",
    //   data: result,
    // });
    return response.SucessResponse(
      res,
      200,
      message.bankFetched,
      (data = result),
    );
  } catch (error) {
    console.log("Errorrrr--=-=-=", error);
    return response.errorResponse(res, 500, error.message, null);
  }
}
  /**
   * Get single bank account
   * GET /api/bank-accounts/:id
   */
  const getBankAccountByIdd = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const accountId = req.params.id;

      const result = await bankAccountService.getBankAccountById(
        userId,
        accountId,
      );

      return response.SucessResponse(
        res,
        200,
        message.bankFetched,
        (data = result),
      );
    } catch (error) {
      console.log("Errorrrr--=-=-=", error);
      return response.errorResponse(res, 500, error.message, null);
    }
  };

  /**
   * Update bank account
   * PUT /api/bank-accounts/:id
   */
  const updateBankAccount = async (req, res, next) => {
    try {
    const userId = req.user.userId;
      const accountId = req.params.id;

      const result = await bankAccountService.updateBankAccount(
        userId,
        accountId,
        req.body,
      );

      // return res.status(200).json({
      //   success: true,
      //   message: "Bank account updated successfully",
      //   data: result,
      // });

        return response.SucessResponse(
        res,
        200,
        message.bankUpdated,
        (data = result),
      );
    } catch (error) {
      console.log("Errorrrr--=-=-=", error);
      return response.errorResponse(res, 500, error.message, null);
    }
  };

  /**
   * Disconnect bank account
   * PATCH /api/bank-accounts/:id/disconnect
   */
  const disconnectBankAccount = async (req, res, next) => {
    try {
    const userId = req.user.userId;
      const accountId = req.params.id;

      const result = await bankAccountService.disconnectBankAccount(
        userId,
        accountId,
      );

      // return res.status(200).json({
      //   success: true,
      //   message: "Bank account disconnected successfully",
      //   data: result,
      // });

           return response.SucessResponse(
        res,
        200,
        message.bankDisconnect,
        (data = result),
      );
    } catch (error) {
      console.log("Errorrrr--=-=-=", error);
      return response.errorResponse(res, 500, error.message, null);
    }
  };

  /**
   * Soft delete bank account
   * DELETE /api/bank-accounts/:id
   */
  const deleteBankAccount = async (req, res, next) => {
    try {
         const userId = req.user.userId;
      const accountId = req.params.id;

      const result = await bankAccountService.deleteBankAccount(
        userId,
        accountId,
      );

      // return res.status(200).json({
      //   success: true,
      //   message: "Bank account deleted successfully",
      //   data: result,
      // });
      
           return response.SucessResponse(
        res,
        200,
        message.bankDeleted,
        (data = result),
      );
    } catch (error) {
      console.log("Errorrrr--=-=-=", error);
      return response.errorResponse(res, 500, error.message, null);
    }
  };

  /**
   * Mark account syncing
   * PATCH /api/bank-accounts/:id/sync/start
   */
  const startBankSync = async (req, res, next) => {
    try {
      const userId = req.user?._id || req.user?.id;
      const accountId = req.params.id;

      const result = await bankAccountService.markSyncing(userId, accountId);

      return res.status(200).json({
        success: true,
        message: "Bank account sync started",
        data: result,
      });
    } catch (error) {
      console.log("Errorrrr--=-=-=", error);
      return response.errorResponse(res, 500, error.message, null);
    }
  };

  /**
   * Mark account sync success
   * PATCH /api/bank-accounts/:id/sync/success
   */
  const completeBankSync = async (req, res, next) => {
    try {
      const userId = req.user?._id || req.user?.id;
      const accountId = req.params.id;

      const result = await bankAccountService.markSyncSuccess(
        userId,
        accountId,
      );

      return res.status(200).json({
        success: true,
        message: "Bank account sync completed successfully",
        data: result,
      });
    } catch (error) {
      console.log("Errorrrr--=-=-=", error);
      return response.errorResponse(res, 500, error.message, null);
    }
  };

  /**
   * Mark account sync failed
   * PATCH /api/bank-accounts/:id/sync/failed
   */
  const failBankSync = async (req, res, next) => {
    try {
      const userId = req.user?._id || req.user?.id;
      const accountId = req.params.id;

      const result = await bankAccountService.markSyncFailed(userId, accountId);

      return res.status(200).json({
        success: true,
        message: "Bank account sync marked as failed",
        data: result,
      });
    } catch (error) {
      console.log("Errorrrr--=-=-=", error);
      return response.errorResponse(res, 500, error.message, null);
    }
  };


module.exports = {
  createBankAccount,
  getBankAccounts,
  getBankAccountByIdd,


    updateBankAccount,
    disconnectBankAccount,
  //   deleteBankAccount,
  //   startBankSync,
  //   completeBankSync,
  //   failBankSync,
};
