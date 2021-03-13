const catchAsyncErrors = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const errorStatus = require('../constants/errorConstants');
const User = require('../models/userModel');
const UserRoles = require('../constants/userConstants');
const ObjectId = require('mongoose').Types.ObjectId;
const APIFeatures = require('../utils/apiFeatures');

exports.getAll = (Model, modelName) =>
  catchAsyncErrors(async (req, res, next) => {
    const { tourId, userId } = req.params;

    //reviews part : to allow nested GET reviews
    let filterObj = {};
    if (tourId && userId) {
      filterObj = { tour: tourId, user: userId };
    } else if (!tourId && userId) {
      filterObj = { user: userId };
    } else if (tourId && !userId) {
      filterObj = { tour: tourId };
    }
    console.log('req.query : ', req.query);
    const v = typeof req.query;
    console.log(v);
    // BUILDING A QUERY
    const features = new APIFeatures(Model.find(filterObj), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    //EXECUTING THE QUERY
    const docs = await features.query;

    if (!docs) {
      const errorMessage = `No ${modelName} found for this`;

      return next(new AppError(errorMessage, errorStatus.BAD_REQUEST));
    }

    const data = {};
    data[modelName] = docs;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data,
    });
  });

exports.getOne = (Model, modelName, populateOptions) =>
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const isValidId = ObjectId.isValid(id) ? true : false;

    if (!isValidId) {
      const errorMessage = `invalid ID for a ${modelName}`;
      return next(new AppError(errorMessage, errorStatus.BAD_REQUEST));
    }
    let query = Model.findById(id);
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    const doc = await query;

    if (!doc) {
      const errorMessage = ` No ${modelName} found with that ID`;

      return next(new AppError(errorMessage, errorStatus.NOT_FOUND));
    }

    const data = {};
    data[modelName] = doc;

    res.status(200).json({
      status: 'success',
      data,
    });
  });

exports.deleteOne = (Model, modelName) =>
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const doc = await Model.findByIdAndDelete(id);

    if (!doc) {
      const errorMessage = ` No ${modelName} found with that ID`;
      return next(new AppError(errorMessage, errorStatus.NOT_FOUND));
    }

    res.status(204).json({
      status: 'success',

      data: null,
    });
  });

exports.createOne = (Model, modelName) =>
  catchAsyncErrors(async (req, res, next) => {
    {
      const { body } = req;

      const newDoc = await Model.create(body);

      const data = {};
      data[modelName] = newDoc;

      return res.status(201).json({ status: 'success', data: data });
    }
  });

exports.updateOne = (Model, modelName) =>
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { body } = req;

    const UpdatedDoc = await Model.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!UpdatedDoc) {
      const errorMessage = `No ${modelName} found with that ID;`;
      return next(new AppError(errorMessage, errorStatus.NOT_FOUND));
    }

    const data = {};
    data[modelName] = UpdatedDoc;

    res.status(200).json({
      status: 'success',
      data,
    });
  });
