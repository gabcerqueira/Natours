const express = require('express');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const morgan = require('morgan');
const AppError = require('./utils/appError');
const errorStatus = require('./constants/errorConstants');
const {
  globalErrorHandler,
} = require('./controllers/errorController');
const app = express();
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  const { originalUrl } = req;
  const errorMessage = `Can't find ${originalUrl} on this server`;
  next(new AppError(errorMessage, errorStatus.NOT_FOUND));
});

app.use(globalErrorHandler);

module.exports = app;
