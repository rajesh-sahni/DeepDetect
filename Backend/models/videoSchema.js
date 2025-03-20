const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  timestamp: { type: Number, required: true },
  objects: [
    {
      class: { type: String, required: true },
      score: { type: Number, required: true },
      bbox: { type: [Number], required: true }, // Array of [x, y, width, height]
    },
  ],
});

module.exports = mongoose.model("DetectedVideoObject", videoSchema);
