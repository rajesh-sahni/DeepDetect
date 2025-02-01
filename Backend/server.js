const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const objectRouter = require(".//routes/objectRoutes.js");
dotenv.config({ path: "./config/.env" });
const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database connected successfully!");
    app.listen(process.env.PORT, (err) => {
      if (err) {
        console.log("Server crashed: ", err);
      } else {
        console.log(`Server is running on PORT ${process.env.PORT}`);
      }
    });
  })
  .catch((err) => {
    console.log("Database connection failed!");
  });

app.use(objectRouter);
