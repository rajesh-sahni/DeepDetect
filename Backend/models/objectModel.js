const mongoose = require("mongoose");

const objectSchema = new mongoose.Schema({
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

const DetectedObject = mongoose.model("DetectedObject", objectSchema);
module.exports = DetectedObject;
