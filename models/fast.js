const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const FastSchema = new Schema(
  {
    status: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Fast = mongoose.model("fast", FastSchema);

module.exports = Fast;
