const expenseCategoryService = require("../../services/Expense/expenseCategoryService");
const response = require("../../utils/response");
const message = require("../../constants/message");

const createCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    const userId = req.user.userId;

    const newCategory = await expenseCategoryService.addCategory(
      categoryData,
      userId,
    );
    return response.SucessResponse(
      res,
      200,
      message.categoryCreated,
      newCategory,
    );
  } catch (error) {
    console.log("Errorrrr--=-=-=", error);
    return response.errorResponse(res, 500, error.message, null);
  }
};

const categoryList = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;
    console.log(userId);
    const data = await expenseCategoryService.categoryList(userId, {
      search,
      page,
      limit,
    });
    console.log("data", data);
    return response.SucessResponse(res, 200, message.categoryFetched, data);
  } catch (error) {
    console.log("Errorrrr--=-=-=", error);
    return response.errorResponse(res, 500, error.message, null);
  }
};

const categoryById = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { id } = req.params;

    console.log("categoryId =", id);

    const dataaa = await expenseCategoryService.categoryById(userId, id);
    console.log("data =", dataaa);

    return response.SucessResponse(res, 200, message.categoryFetched, dataaa);
  } catch (error) {
    console.log(error);
    return response.errorResponse(res, 500, error.message, null);
  }
};
const updateCategory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { id } = req.params;
    const categoryData = req.body;
    console.log("categoryId =", id);
    console.log("categoryData =", categoryData);
    const updateCategoryData = await expenseCategoryService.UpdateCategory(
      userId,
      id,
      categoryData,
    );
    console.log("data =", updateCategoryData);

    return response.SucessResponse(
      res,
      200,
      message.updateCategory,
      updateCategoryData,
    );
  } catch (error) {
    console.log(error);
    return response.errorResponse(res, 500, error.message, null);
  }
};

module.exports = {
  createCategory,
  categoryList,
  categoryById,
  updateCategory,
};
