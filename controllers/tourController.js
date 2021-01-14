const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const errorStatus = require('../constants/errorConstants');
const catchAsyncErrors = require('../utils/catchAsync');
const ObjectId = require('mongoose').Types.ObjectId;
const getAllTours = catchAsyncErrors(async (req, res, next) => {
  // BUILDING A QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  //EXECUTING THE QUERY
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

const getOneTour = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const isValidId = ObjectId.isValid(id) ? true : false;

  /*
  if (!isValidId) {
    const errorMessage = 'invalid ID for a tour';
    return next(new AppError(errorMessage, errorStatus.BAD_REQUEST));
  }
  */

  const tour = await Tour.findById(id);

  if (!tour) {
    const errorMessage = 'No tour found with that ID';

    return next(new AppError(errorMessage, errorStatus.NOT_FOUND));
  }

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});

const createTour = catchAsyncErrors(async (req, res, next) => {
  const { body } = req;

  const newTour = await Tour.create(body);

  return res
    .status(201)
    .json({ status: 'success', data: { tour: newTour } });
});

const updateTour = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;

  const UpdatedTour = await Tour.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!UpdatedTour) {
    const errorMessage = 'No tour found with that ID';
    return next(new AppError(errorMessage, errorStatus.NOT_FOUND));
  }

  res.status(200).json({
    status: 'success',
    data: { tour: UpdatedTour },
  });
});

const deleteTour = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const tour = await Tour.findByIdAndDelete(id);

  if (!tour) {
    const errorMessage = 'No tour found with that ID';
    return next(new AppError(errorMessage, errorStatus.NOT_FOUND));
  }

  res.status(204).json({
    status: 'success',

    data: null,
  });
});

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
