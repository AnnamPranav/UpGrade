
const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  sessionId: String,
  questions: [String],
  answers: [String],
  scores: [Number]
});

module.exports = mongoose.model("Interview", interviewSchema);
