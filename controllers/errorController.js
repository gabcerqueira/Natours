const errorStatus = require('../constants/errorConstants');
const AppError = require('../utils/appError');

const sendErrorForDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorForProd = (err, res) => {
  // Operational,trusted error: message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Unknown error , we dont show the details
    console.error('ERROR', err);
    res.status(errorStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Something went wrong !',
    });
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, errorStatus.BAD_REQUEST);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(?:\\.|[^\\])*?\1/);
  const message = `Duplicate field for : ${value[0].replace(
    /"/g,
    ''
  )} , Please use another value`;
  return new AppError(message, errorStatus.BAD_REQUEST);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data : ${errors.join(' .  ')}`;
  return new AppError(message, errorStatus.BAD_REQUEST);
};

const handleJWTVerification = () => {
  const message = 'Unauthorized ! please log in to proceed';
  return new AppError(message, errorStatus.UNAUTHORIZED);
};

const handleTokenExpiredError = () => {
  const message = 'your token has expired , please log in again';
  return new AppError(message, errorStatus.UNAUTHORIZED);
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || errorStatus.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorForDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error = { ...error, name: err.name, message: err.message };
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError')
      error = handleJWTVerification();
    if (error.name === 'TokenExpiredError')
      error = handleTokenExpiredError();

    sendErrorForProd(error, res);
  }
};

module.exports = {
  globalErrorHandler,
};
