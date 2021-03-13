const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const errorStatus = require('../constants/errorConstants');
const catchAsyncErrors = require('../utils/catchAsync');
const ObjectId = require('mongoose').Types.ObjectId;
const factory = require('../controllers/handlerFactory');
const { Mongoose } = require('mongoose');

const getAllTours = factory.getAll(Tour, 'Tour');
const getOneTour = factory.getOne(Tour, 'Tour', { path: 'reviews' });
const createTour = factory.createOne(Tour, 'Tour');
const updateTour = factory.updateOne(Tour, 'Tour');
const deleteTour = factory.deleteOne(Tour, 'Tour');
const getTourStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'easy' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});
const getMonthlyPlan = catchAsyncErrors(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: { plan },
  });
});

module.exports = {
  getAllTours,
  getOneTour,
  createTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
};
