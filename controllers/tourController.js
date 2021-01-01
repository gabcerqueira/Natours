const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const getAllTours = async (req, res) => {
  try {
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
  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: 'fail',
      data: error.message,
    });
  }
};

const getOneTour = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const tour = await Tour.findById(id);

    res.status(200).json({
      status: 'success',
      data: { tour },
    });
  } catch (error) {
    console.log(error.message);
    res.status(404).json({
      status: 'fail',
      data: error.message,
    });
  }
};

const createTour = async (req, res) => {
  const { body } = req;
  try {
    const newTour = await Tour.create(body);

    return res
      .status(201)
      .json({ status: 'success', data: { tour: newTour } });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({
      status: 'fail',
      data: error.message,
    });
  }
};

const updateTour = async (req, res) => {
  const { id } = req.params;
  const { body } = req;

  try {
    const UpdatedTour = await Tour.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: { tour: UpdatedTour },
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({
      status: 'fail',
      data: error.message,
    });
  }
};

const deleteTour = async (req, res) => {
  const { id } = req.params;

  try {
    await Tour.findByIdAndDelete(id);
    res.status(204).json({
      status: 'success',

      data: null,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(404)
      .json({ status: 'fail', data: error.message });
  }
};

const getTourStats = async (req, res) => {
  try {
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
  } catch (error) {
    console.log(error.message);
    res.status(404).json({
      status: 'fail',
      data: error.message,
    });
  }
};

const getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (error) {
    console.log(error.message);
    res.status(404).json({
      status: 'fail',
      data: error.message,
    });
  }
};

module.exports = {
  getAllTours,
  getOneTour,
  createTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
};
