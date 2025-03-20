const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  objectName: {
    type: String,
    required: true,
  },
  probability: {
    type: Number,
    required: true,
  },
  detectedAt: {
    type: Date,
    default: Date.now,
  },
});

const DetectedImageObject = mongoose.model("DetectedImageObject", imageSchema);
module.exports = DetectedImageObject;
