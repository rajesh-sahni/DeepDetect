const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

require("dotenv").config({ path: "./config/.env" });

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect Database
connectDB();

// Routes
app.use("/api", require("./routes/imageRoutes"));
app.use("/api", require("./routes/videoRoutes"));
app.use("/api", require("./routes/liveVideoRoutes"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
