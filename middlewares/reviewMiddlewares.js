const setTourUserIds = (req, res, next) => {
  //Allow nested Routes
  if (!req.body.user) req.body.user = req.user.id;

  if (!req.body.tour) req.body.tour = req.params.tourId;
  next();
};

module.exports = {
  setTourUserIds,
};
