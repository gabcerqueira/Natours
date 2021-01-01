const express = require('express');
const userRouter = express.Router();
const {
  getAllUsers,
  createUser,
  getOneUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

userRouter.route('/').get(getAllUsers).post(createUser);
userRouter
  .route('/:id')
  .get(getOneUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = userRouter;
