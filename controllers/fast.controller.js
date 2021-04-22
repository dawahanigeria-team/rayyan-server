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

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
module.exports.createUser = async (req, res) => {
  try {
    const fast = await userService.registerUser(req.body);

    const emailToken = tokenService.createToken(
      { id: user.id, email: user.email },
      config.jwt.JWT_EMAIL_SECRET,
      "6h"
    );

    const baseUrl = req.protocol + "://" + req.get("host");
    const url = baseUrl + `/api/auth/confirmation/${emailToken}`;

    mailerService.sendMail(user.email, "Confirm Email", "confirm-email", {
      url: url,
      name: user.firstName,
    });

    res.status(201).send(user);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

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
