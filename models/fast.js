const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const FastSchema = new Schema(
  {
    name: { type: String },
    status: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Fast = mongoose.model("fast", FastSchema);

module.exports = Fast;
