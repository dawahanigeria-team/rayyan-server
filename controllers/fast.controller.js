const Fast = require("./../models/fast");
const asyncHandler = require("../middlewares/asyncHandler");

// @desc Post Add New Fast
// @route Post /api/fast/
// @access Private
module.exports.createNewFast = asyncHandler(async (req, res) => {
  const fast = await Fast.create(req.body);
  res.status(201).json({ success: true, data: { fast } });
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
module.exports.getMissedFasts = asyncHandler( async (req, res) => {
  const user = req.query.user
  const fast = await Fast.find({ user: user, status: false });

  res.status(200).json({success: true, data: { fast}});
  
})

// @desc    Get all fasts
// @route   GET /api/fasts
// @access  Private/Admin
module.exports.getFasts = async (req, res) => {
  try {
    const fasts = await Fast.find({});
    res.status(200).send(fasts);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

// @desc    Update fast by ID
// @route   GET /api/fast/:id
// @access  Private/Admin
module.exports.updateSingleFast = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).send(user);
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
};

// @desc    Delete fast
// @route   DELETE /api/fast/:id
// @access  Private/Admin
module.exports.deleteFast = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await Fast.deleteOne({ _id: id });
  res.status(200).send({ message: "success", data: {} });
});
