const Fast = require("./../models/fast");
const asyncHandler = require("../middlewares/asyncHandler");

// @desc Post Add New Fast
// @route Post /api/fast/
// @access Private

module.exports.createNewFast = asyncHandler(async (req, res) => {
  const fast = await Fast.create(req.body);
  res.status(201).json({ success: true, data: { fast } });
});

// @desc Post bull Fast
// @route Post /api/fast/bulkfasts?number
// @access Private

module.exports.createBulkFast = asyncHandler(async (req, res) => {
  const { description, user, number } = req.body;

  var bulkfasts = [];
  for (var i = 1; i <= number; ++i) {
    var newFast = {
      name: `Missed Fast ${Math.random()}`,
      description: description,
      user: user,
    };

    bulkfasts.push(newFast);
  }
  const fasts = await Fast.insertMany(bulkfasts);
  res.status(201).json({ success: true, data: { fasts } });
});

// @desc Update user profile
// @route PUT /api/fast/:id
// @access Private
module.exports.GetSingleFast = asyncHandler(async (req, res) => {
  const fast = await Fast.findOne({ _id: req.params.id });
  res.status(200).json({ message: "success", data: { fast: fast } });
});

// @desc    Get Missed Fast
// @route   GET /api/fast/missedfast
// @access  Private/Admin
module.exports.getMissedFasts = asyncHandler(async (req, res) => {
  const user = req.query.user;
  const fast = await Fast.find({ user: user, status: false });

  res.status(200).json({ success: true, data: { fast } });
});

// @desc    Get all fasts
// @route   GET /api/fasts
// @access  Private/Admin
module.exports.getFasts = asyncHandler(async (req, res) => {
  const user = req.query.user;
  const fasts = await Fast.find({ user: user });
  res.status(200).send(fasts);
});

// @desc    Get all fasts
// @route   GET /api/fasts
// @access  Private/Admin

// module.exports.getFasts = asyncHandler( async (req, res) => {
// const user = req.query.user;
//     const fasts = await Fast.find({user: user});
//     res.status(200).send(fasts);

// });

// @desc    Update fast by ID
// @route   GET /api/fast/:id
// @access  Private/Admin
module.exports.updateSingleFast = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const fast = await Fast.findOneAndUpdate(
    { _id: id },
    { $set: { status: true } },
    { new: true }
  );
  res.status(200).json({ success: true, data: { fast } });
});

// @desc    Delete fast
// @route   DELETE /api/fast/:id
// @access  Private/Admin
module.exports.deleteFast = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await Fast.deleteOne({ _id: id });
  res.status(200).send({ message: "success", data: {} });
});
