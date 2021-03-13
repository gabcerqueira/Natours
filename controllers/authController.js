const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const errorStatus = require('../constants/errorConstants');
const UserRoles = require('../constants/userConstants');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsyncErrors = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  ),
  // secure: true, -> essa opção deve ser para ambiente de produção
  httpOnly: true,
};
if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
const createAndSendToken = (user, statusCode, res) => {
  const newtoken = signToken(user._id);

  res.cookie('jwt', newtoken, cookieOptions);

  //removing the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token: newtoken,
    data: {
      user,
    },
  });
};

const signUp = catchAsyncErrors(async (req, res, next) => {
  const {
    body: { name, email, password, passwordConfirm, role },
  } = req;

  const newUser = await User.create(req.body);
  createAndSendToken(newUser, 201, res);
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

  createAndSendToken(user, 200, res);
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
  if (!decodedPayload) {
    const errorMessage = 'This JWT is invalid , please log in again';
    return next(new AppError(errorMessage, errorStatus.FORBIDDEN));
  }

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

  const resetUrl =
    process.env.DEVELOPMENT_URL +
    process.env.PORT +
    `/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and
    the password confirmation to : ${resetUrl}\n If you did not forget your password
    just ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Reset you password from Natours (valid for 10 minutes)',
      message,
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(error);
    const errorMessage = 'error sending the email , try again later';
    return next(
      new AppError(errorMessage, errorStatus.INTERNAL_SERVER_ERROR)
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'a link has been sent to your email to reset your password',
  });
});

const resetPassword = catchAsyncErrors(async (req, res, next) => {
  //1 get the user based on the token
  const { token } = req.params;

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) if token has not expired, and there is user, set new password
  if (!user) {
    const errorMessage = 'Token is invalid or has expired';
    return next(new AppError(errorMessage, errorStatus.NOT_FOUND));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) Update changedPasswordAt property for the user
  /*
 
  */

  //4) Log the user in , send the JWT,
  createAndSendToken(user, 200, res);
});

const updatePassword = catchAsyncErrors(async (req, res, next) => {
  // 1 ) get the user from collection

  const { currentPassword, newPassword, newPasswordConfirm } = req.body;
  const { id } = req.user;

  const user = await User.findById(id).select('+password');

  //2) check if the currentPassword is correct

  const isPasswordCorrect = await user.correctPassword(
    currentPassword,
    user.password
  );

  if (!isPasswordCorrect) {
    const errorMessage = 'current password is invalid !';
    return next(new AppError(errorMessage, errorStatus.BAD_REQUEST));
  }

  //3) if so , then update password
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();
  // User.findByIdAndUpdate dont pass to the mongoose middlewares.
  //4) log user in and send jwt

  createAndSendToken(user, 200, res);
});

module.exports = {
  signUp,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
};
