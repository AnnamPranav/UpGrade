const express = require("express");
const router = express.Router();

// Static questions for testing
const questions = [
  "Tell me about yourself",
  "What are your strengths?",
  "What are your weaknesses?",
  "Why should we hire you?",
  "Where do you see yourself in 5 years?"
];

// Temporary session storage
let sessions = {};

// START INTERVIEW
router.post("/start", (req, res) => {
  const sessionId = Date.now().toString();

  sessions[sessionId] = {
    questionIndex: 0,
    scores: [],
    feedbacks: []
  };

  res.json({
    completed: false,
    sessionId: sessionId,
    questionNumber: 1,
    difficulty: "medium",
    question: questions[0]
  });
});

// SUBMIT ANSWER
router.post("/answer", (req, res) => {
  const { sessionId, answer } = req.body;

  if (!sessionId || !answer || answer.trim() === "") {
    return res.status(400).json({
      completed: false,
      message: "sessionId and answer are required"
    });
  }

  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({
      completed: false,
      message: "Session not found"
    });
  }

  // Dummy evaluation
  const score = 8;
  const feedback = "Good answer";

  session.scores.push(score);
  session.feedbacks.push(feedback);

  // Move to next question
  session.questionIndex++;

  if (session.questionIndex < questions.length) {
    return res.json({
      completed: false,
      score,
      feedback,
      nextDifficulty: "medium",
      nextQuestionNumber: session.questionIndex + 1,
      nextQuestion: questions[session.questionIndex]
    });
  }

  const finalScore =
    session.scores.reduce((sum, score) => sum + score, 0) /
    session.scores.length;

  return res.json({
    completed: true,
    finalScore,
    scores: session.scores,
    feedbacks: session.feedbacks
  });
});

module.exports = router;