const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const errorStatus = require('../constants/errorConstants');
const catchAsyncErrors = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');

const getAllReviewsFromUser = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;

  const review = await Tour.findById({ user: userId });

  if (!review) {
    const errorMessage = 'No reviews found for this user';

    return next(new AppError(errorMessage, errorStatus.BAD_REQUEST));
  }

  res.status(200).json({
    status: 'success',
    data: { review },
  });
});

const getAllReviewsFromTour = catchAsyncErrors(async (req, res, next) => {
  const { tourId } = req.params;

  const reviews = await Review.find({ tour: tourId });

  if (!reviews) {
    const errorMessage = 'No reviews found for this tour';

    return next(new AppError(errorMessage, errorStatus.BAD_REQUEST));
  }

  res.status(200).json({
    status: 'success',
    data: { reviews },
  });
});

const getAllReviews = factory.getAll(Review, 'Review');
const getOneReview = factory.getOne(Review, 'Review');
const createReview = factory.createOne(Review, 'Review');
const updateReview = factory.updateOne(Review, 'Review');
const deleteReview = factory.deleteOne(Review, 'Review');

module.exports = {
  getAllReviews,
  getAllReviewsFromUser,
  getAllReviewsFromTour,
  createReview,
  deleteReview,
  updateReview,
  getOneReview,
};
