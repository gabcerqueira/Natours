const express = require('express');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const errorStatus = require('./constants/errorConstants');
const { globalErrorHandler } = require('./controllers/errorController');
const app = express();

//1) <-- GLOBAL MIDDLEWARES -->
// <-- SET SECURITY HTTP headers -->
app.use(helmet());

// <-- Development logging the requests -->
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// <-- Limit requests from the same API -->
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, try again later',
});
app.use('/api', limiter);

// <-- Body parser, reading data from body -->
app.use(express.json({ limit: '10kb' }));

// <-- DATA SANITIZATION AGAINST NOSQL QUERY INJECTION -->
app.use(mongoSanitize());

// <-- DATA SANITIZATION AGAINST XSS -->
app.use(xss());

// <-- Prevent parameter pollution -->
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//<-- ROUTERS -->
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//Handling not implemented routes or routes that does not exist
app.all('*', (req, res, next) => {
  const { originalUrl } = req;
  const errorMessage = `Can't find ${originalUrl} on this server`;
  next(new AppError(errorMessage, errorStatus.NOT_FOUND));
});

//Middleware to handle the errors
app.use(globalErrorHandler);

module.exports = app;
