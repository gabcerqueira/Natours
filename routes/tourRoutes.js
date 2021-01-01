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
const {
  topFiveCheap,
} = require('../middlewares/toursMiddlewares.js');

//tourRouter.param('id', checkValidId);

tourRouter.route('/top-5-cheap').get(topFiveCheap, getAllTours);
tourRouter.route('/tour-stats').get(getTourStats);
tourRouter.route('/monthlyPlain/:year').get(getMonthlyPlan);

tourRouter.route('/').get(getAllTours).post(createTour);

tourRouter
  .route('/:id')
  .get(getOneTour)
  .patch(updateTour)
  .delete(deleteTour);

module.exports = tourRouter;
