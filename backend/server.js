require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/interviewDB")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Routes
const interviewRoutes = require("./routes/interviewRoutes");
app.use("/interview", interviewRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend running...");
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
console.log(process.env.OPENAI_API_KEY);

