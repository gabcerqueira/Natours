const express = require('express');
const userRouter = express.Router();
const {
  getAllUsers,
  createUser,
  getOneUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const {
  signUp,
  login,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

userRouter.post('/signUp', signUp);
userRouter.post('/login', login);

userRouter.post('/forgotPassword', forgotPassword);
userRouter.post('/resetPassword', resetPassword);

userRouter.route('/').get(getAllUsers).post(createUser);

userRouter
  .route('/:id')
  .get(getOneUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = userRouter;
