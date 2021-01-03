const errorStatus = require('../constants/errorConstants');

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

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || errorStatus.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorForDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorForProd(err, res);
  }
};

module.exports = {
  globalErrorHandler,
};
