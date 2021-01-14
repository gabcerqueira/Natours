const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const errorStatus = require('../constants/errorConstants');
const UserRoles = require('../constants/userConstants');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsyncErrors = require('../utils/catchAsync');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const signUp = catchAsyncErrors(async (req, res, next) => {
  const {
    body: { name, email, password, passwordConfirm, role },
  } = req;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  //
  if (!email || !password) {
    const errorMessage = 'Please send a valid email or password';
    return next(new AppError(errorMessage, errorStatus.BAD_REQUEST));
  }

  const user = await User.findOne({ email }).select('+password');

  //Check if user exists && password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    const errorMessage = 'Incorrect email or password';
    return next(new AppError(errorMessage, errorStatus.UNAUTHORIZED));
  }
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    data: {},
  });
});

const protect = catchAsyncErrors(async (req, res, next) => {
  //1) get the token from the header , check if exists
  let token = null;

  const { authorization } = req.headers;
  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
  }

  if (!token) {
    const errorMessage = 'forbidden! please log in to get access';
    return next(new AppError(errorMessage, errorStatus.UNAUTHORIZED));
  }

  //2) verification of the token
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  //3) Check if user still exists
  const currentUser = await User.findById(decodedPayload.id);

  if (!currentUser) {
    const errorMessage =
      'the user belonging to this token does no longer exists';
    return next(new AppError(errorMessage, errorStatus.UNAUTHORIZED));
  }

  //4) Check if user changed password after the token is issued
  if (currentUser.changedPasswordAfter(decodedPayload.iat)) {
    const errorMessage =
      'User recently changed password ! Please log in again';
    return next(new AppError(errorMessage, errorStatus.UNAUTHORIZED));
  }

  // Grant acess to the protected Route
  req.user = currentUser;
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  const { role } = req.user;
  if (!roles.includes(role)) {
    const errorMessage =
      'You do not have permission to perform this action';
    return next(new AppError(errorMessage, errorStatus.FORBIDDEN));
  }
  next();
};

const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  // check if email exists
  const { email } = req.body;

  if (!email) {
    const errorMessage = 'The email provided is invalid';
    return next(new AppError(errorMessage, errorStatus.BAD_REQUEST));
  }

  const user = await User.findOne({ email: email });

  if (!user) {
    const errorMessage = 'Email invalid for this user';
    return next(new AppError(errorMessage, errorStatus.NOT_FOUND));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //send the link to the email to set password

  res.status(200).json({
    status: 'success',
    message: 'a link has been sent to your email to reset your password',
  });
});

const resetPassword = (req, res, next) => {
  //check if email matches
  //
};

module.exports = {
  signUp,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
};
