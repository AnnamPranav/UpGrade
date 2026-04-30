const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  sessionId: String,
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  difficulty: {
    type: String,
    default: "medium"
  },
  questions: [String],
  answers: [String],
  scores: [Number],
  feedbacks: [String],
  difficulties: [String]
});

module.exports = mongoose.model("Interview", interviewSchema);
