const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const FastSchema = new Schema(
  {
    name: { type: String, required: true },
    status: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      unique: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Fast = mongoose.model("fast", FastSchema);

module.exports = Fast;
