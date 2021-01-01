const getAllUsers = (req, res) => {
  res
    .status(500)
    .json({ status: 'fail', message: 'route not implemented' });
};

const getOneUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'fail', message: 'route not implemented' });
};

const createUser = (req, res) => {
  res
    .status(201)
    .json({ status: 'fail', message: 'route not implemented' });
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
