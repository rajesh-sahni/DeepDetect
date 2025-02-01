const express = require("express");
const mongoose = require("mongoose");
const DetectedObject = require("../models/objectModel.js");
const router = express.Router();

// Create object operation
router.post("/", async (req, res) => {
  try {
    console.log("Received Data:", req.body); 
    const detectedObjects = req.body;

    if (!Array.isArray(detectedObjects) || detectedObjects.length === 0) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    await DetectedObject.insertMany(detectedObjects);
    res.status(201).json({ message: "Data saved successfully" });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Get all Data
// Get operation
router.get("/", async (req, res) => {
  try {
    const showAll = await DetectedObject.find();
    res.status(200).json(showAll);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
