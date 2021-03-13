const express = require('express');
const userRouter = express.Router();
const reviewRouter = require('./reviewRoutes');
const UserRoles = require('../constants/userConstants');
const {
  getAllUsers,
  createUser,
  getOneUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
} = require('../controllers/userController');
const {
  signUp,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
} = require('../controllers/authController');

userRouter.use('/:userId/reviews', reviewRouter);

userRouter.post('/signUp', signUp);
userRouter.post('/login', login);

userRouter.post('/forgotPassword', forgotPassword);
userRouter.patch('/resetPassword/:token', resetPassword);

userRouter.patch('/updateMyPassword', protect, updatePassword);
userRouter.get('/getMe', protect, getMe, getOneUser);
userRouter.patch('/updateMe', protect, updateMe);
userRouter.delete('/deleteMe', protect, deleteMe);

userRouter.use(protect);
userRouter.use(restrictTo(UserRoles.ADMIN));
userRouter.route('/').get(getAllUsers).post(createUser);
userRouter
  .route('/:id')
  .get(getOneUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = userRouter;
