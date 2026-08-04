const expenseCategory = require("../models/expenseCategory");
const activitylogs = require("../services/activityService");
const activityServicActions = require("../constants/activityActions");
const User = require("../models/user");

const addCategory = async (categoryData, userId) => {
  // console.log("User ID:", userId);
  // console.log("Payload:", {
  //   ...categoryData,
  //   createdBy: userId,
  // });
  // console.log("INNN CONTROLLER");
  if (!userId) {
    throw new Error("User not found");
  }
  const exists = await expenseCategory.findOne({
    categoryName: {
      $regex: new RegExp("^" + categoryData.categoryName + "$", "i"),
    },
    isDeleted: false,
  });
  if (exists) {
    throw new Error("Category already Exist");
  }
  const user = await User.findById(userId);

  if (user) {
    await activitylogs.createActivity({
      userId,
      action: activityServicActions.CREATE_CATEGORY,
      module: "CATEGORY INFO",
      description: `${user.name} create "${categoryData.categoryName}" Category `,
    });
  }
  const payload = {
    ...categoryData,
    createdBy: userId,
  };

  return await expenseCategory.create(payload);
};

const categoryList = async (userId) => {
  console.log("User ID:", userId);

  if (!userId) {
    throw new Error("User not Found");
  }

  const categoryList = await expenseCategory
    .find({
      createdBy: userId,
      isDeleted: false,
    })
    .sort({ categoryName: 1 });
  console.log("categoryList", categoryList);
  const user = await User.findById(userId);
  console.log("user", user);
  if (user) {
    await activitylogs.createActivity({
      userId,
      action: activityServicActions.GET_CATEGORY,
      module: "CATEGORY INFO",
      description: `${user.name} fetched categories`,
    });
  }

  return categoryList;
};

const categoryById = async (userId, categoryId) => {
  console.log("User ID:", userId);
  console.log("categoryId:", categoryId);

  if (!userId) {
    throw new Error("User not Found");
  }
  const categoryData = await expenseCategory.find({
    _id: categoryId,
    createdBy: userId,
    isDeleted: false,
  });
  console.log("categoryData", categoryData);
  const user = await User.findById(userId);
  console.log("user", user);
  if (user) {
    await activitylogs.createActivity({
      userId,
      action: activityServicActions.GET_CATEGORY,
      module: "CATEGORY INFO",
      description: `${user.name} fetched categories by id`,
    });
  }

  return categoryData;
};

const UpdateCategory = async (userId, categoryId, categoryData) => {
  if (!userId) {
    throw new Error("User not found");
  }
console.log(categoryData)
console.log(categoryId)
  const existingCategory = await expenseCategory.findOne({
    _id: categoryId,
    createdBy: userId,
    isDeleted: false,
  });

  if (!existingCategory) {
    throw new Error("Category not found");
  }

  // Duplicate category name check
  if (
    categoryData.categoryName &&
    categoryData.categoryName !== existingCategory.categoryName
  ) {
    const duplicate = await expenseCategory.findOne({
      categoryName: {
        $regex: new RegExp("^" + categoryData.categoryName + "$", "i"),
      },
      createdBy: userId,
      isDeleted: false,
      _id: { $ne: categoryId },
    });

    if (duplicate) {
      throw new Error("Category already exists");
    }
  }

  const updatedCategory = await expenseCategory.findByIdAndUpdate(
    categoryId,
    {
      $set: categoryData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  const user = await User.findById(userId);

  if (user) {
    await activitylogs.createActivity({
      userId,
      action: activityServicActions.UPDATE_CATEGORY,
      module: "CATEGORY INFO",
      description: `${user.name} updated "${updatedCategory.categoryName}" category`,
    });
  }

  return updatedCategory;
};



module.exports = {
  addCategory,
  categoryList,
  categoryById,
  UpdateCategory
};
