const express = require('express');
const tourRouter = express.Router();
const {
  getAllTours,
  createTour,
  getOneTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
} = require('../controllers/tourController');
const UserRoles = require('../constants/userConstants');

const { protect, restrictTo } = require('../controllers/authController');

const { topFiveCheap } = require('../middlewares/toursMiddlewares.js');
const { createReview } = require('../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

//tourRouter.param('id', checkValidId);
tourRouter.use('/:tourId/reviews', reviewRouter);

tourRouter.route('/top-5-cheap').get(topFiveCheap, getAllTours);
tourRouter.route('/tour-stats').get(getTourStats);
tourRouter
  .route('/monthlyPlain/:year')
  .get(
    protect,
    restrictTo(UserRoles.ADMIN, UserRoles.LEAD_GUIDE, UserRoles.GUIDE),
    getMonthlyPlan
  );

tourRouter
  .route('/')
  .get(getAllTours)
  .post(
    protect,
    restrictTo(UserRoles.ADMIN, UserRoles.LEAD_GUIDE),
    createTour
  );

tourRouter
  .route('/:id')
  .get(getOneTour)
  .patch(
    protect,
    restrictTo(UserRoles.ADMIN, UserRoles.LEAD_GUIDE),
    updateTour
  )
  .delete(
    protect,
    restrictTo(UserRoles.ADMIN, UserRoles.LEAD_GUIDE),
    deleteTour
  );

module.exports = tourRouter;
