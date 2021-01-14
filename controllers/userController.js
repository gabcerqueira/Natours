const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({ status: 'success', data: { users } });
});

const getOneUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'route not implemented',
  });
};

const createUser = (req, res) => {
  res.status(201).json({
    status: 'fail',
    message: 'route not implemented',
  });
};

const updateUser = (req, res) => {
  res
    .status(200)
    .json({ status: 'fail', message: 'route not implemented' });
};

const deleteUser = (req, res) => {
  res
    .status(200)
    .json({ status: 'fail', message: 'route not implemented' });
};

module.exports = {
  getAllUsers,
  getOneUser,
  createUser,
  updateUser,
  deleteUser,
};
