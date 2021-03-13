const errorStatus = require('../constants/errorConstants');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsyncErrors = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((field) => {
    if (allowedFields.includes(field)) {
      newObj[field] = obj[field];
    }
  });
  return newObj;
};

const createUser = (req, res, next) => {
  res.status(201).json({
    status: 'fail',
    message: 'route is not defined , use /signup instead',
  });
};

const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const getAllUsers = factory.getAll(User, 'User');
const getOneUser = factory.getOne(User, 'User');
const updateUser = factory.updateOne(User, 'User');
const deleteUser = factory.deleteOne(User, 'User');

const updateMe = catchAsyncErrors(async (req, res, next) => {
  const { body } = req;
  const { password, passwordConfirm } = body;
  const { id } = req.user;

  if (password || passwordConfirm) {
    const errorMessage =
      'This route is not for password updates, please use /updateMyPassword instead.';
    return next(new AppError(errorMessage, errorStatus.BAD_REQUEST));
  }

  const filteredBody = filterObj(body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
const deleteMe = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.user;

  await User.findByIdAndUpdate(id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

module.exports = {
  getAllUsers,
  getOneUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
};
