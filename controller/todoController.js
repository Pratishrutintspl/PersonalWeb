const todoService = require("../services/todoServices");
const response = require("../utils/response");
const message = require("../constants/message");

const createTodo = async (req, res) => {
  try {
    const todoData = req.body;
    console.log("todoData,tod", todoData);
    const userId = req.user.userId;

    const newTodo = await todoService.createTodo(todoData, userId);
    return response.SucessResponse(res, 200, message.todoCreated, newTodo);
  } catch (error) {
    console.log("Errorrrr--=-=-=", error);
    return response.errorResponse(res, 500, error.message, null);
  }
};

// const todoListDate = async (req, res) => {
//   try {
//     const userId = req.user.userId;

//     const { date, page = 1, limit = 6 } = req.query;

//     const data = await todoService.todoListDate(
//       userId,
//       date,
//       Number(page),
//       Number(limit),
//     );

//     return response.SucessResponse(
//       res,
//       200,
//       message.todoFetched,
//       data,
//     );
//   } catch (error) {
//     console.log("Error =", error);

//     return response.errorResponse(
//       res,
//       500,
//       error.message,
//       null,
//     );
//   }
// };

const todoListDate = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      date,
      page = 1,
      limit = 10, 
      search,
    } = req.query;

    const data = await todoService.todoListDate(
      userId,
      date,
      Number(page),
      Number(limit),
      search 

    );

    return response.SucessResponse(
      res,
      200,
      message.todoFetched,
      data,
    );
  } catch (error) {
    console.log("Error =", error);

    return response.errorResponse(
      res,
      500,
      error.message,
      null,
    );
  }
};


const todoList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = await todoService.todoList(userId);
    console.log("vvvvvvvv", todoList);
    return response.SucessResponse(res, 200, message.todoFetched, data);
  } catch (error) {
    console.log("Errrorrrrrr", error);
    return response.errorResponse(res, 500, error.message, null);
  }
};

const updateTodo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    console.log(id);
    console.log(userId);
    const todo = await todoService.updateTodo(id, userId, req.body);
    console.log(todo);
    if (!todo) {
      return response.failResponse(res, 404, message.todonotFound, null);
    }
    return response.SucessResponse(res, 200, message.updateTodo, todo);
  } catch (error) {
    console.log("Errrorrrrrr", error);
    return response.errorResponse(res, 500, error.message, null);
  }
};

const deletetodo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    console.log(id);
    console.log(userId);
    const todo = await todoService.deleteTodo(id, userId, req.body);
    console.log(todo);
    if (!todo) {
      return response.failResponse(res, 404, message.todonotFound, null);
    }
    return response.SucessResponse(res, 200, message.deleteTodo, todo);
  } catch (error) {
    console.log("Errrorrrrrr", error);
    return response.errorResponse(res, 500, error.message, null);
  }
};
const getTodoCountByDate = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await todoService.todoCountByDate(userId);

    return response.SucessResponse(res, 200, message.todoFetched, result);
  } catch (error) {
    console.log("Errrorrrrrr", error);
    return response.errorResponse(res, 500, error.message, null);
  }
};

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date } = req.query;

    const dashboard = await todoService.getDashboard(userId, date);

    return response.SucessResponse(
      res,
      200,
      message.dashboardFetched,
      dashboard,
    );
  } catch (error) {
    console.log("Dashboard Error =", error);

    return response.errorResponse(res, 500, error.message, null);
  }
};
const checkDelayedTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
        const { date } = req.params;

    const dashboard = await todoService.checkDelayedTaskss(userId, date);

    return response.SucessResponse(
      res,
      200,
      message.dashboardFetched,
      dashboard,
    );
  } catch (error) {
    console.log("Dashboard Error =", error);

    return response.errorResponse(res, 500, error.message, null);
  }
};
module.exports = {
  createTodo,
  todoListDate,
  updateTodo,
  deletetodo,
  getTodoCountByDate,
  todoList,
  getDashboard,
  checkDelayedTasks
};
