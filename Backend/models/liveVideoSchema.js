const mongoose = require("mongoose");

const liveVideoSchema = new mongoose.Schema({
  class: String,
  score: Number,
  timestamp: { type: Date, default: Date.now },
});
module.exports = mongoose.model("DetectedLiveVideoObject", liveVideoSchema);
