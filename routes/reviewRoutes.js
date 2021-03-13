const express = require('express');
const reviewRouter = express.Router({ mergeParams: true });

const UserRoles = require('../constants/userConstants');
const { protect, restrictTo } = require('../controllers/authController');
const {
  getAllReviews,
  createReview,
  getAllReviewsFromTour,
  deleteReview,
  updateReview,
  getOneReview,
} = require('../controllers/reviewController');

const { setTourUserIds } = require('../middlewares/reviewMiddlewares');
const { get } = require('./tourRoutes');
reviewRouter.use(protect);
reviewRouter
  .route('/')
  .get(getAllReviews)
  .post(restrictTo(UserRoles.USER), setTourUserIds, createReview);

reviewRouter
  .route('/:id')
  .get(getOneReview)
  .patch(restrictTo(UserRoles.USER, UserRoles.ADMIN), updateReview)
  .delete(restrictTo(UserRoles.USER, UserRoles.ADMIN), deleteReview);

module.exports = reviewRouter;
