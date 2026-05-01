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

// START INTERVIEW
router.post("/start", (req, res) => {
  const sessionId = Date.now().toString();

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
  const { sessionId, answer, questionNumber } = req.body;

  // validation
  if (!sessionId || !answer) {
    return res.status(400).json({
      completed: false,
      message: "sessionId and answer are required"
    });
  }

  // if more questions remaining
  if (questionNumber < 5) {
    return res.json({
      completed: false,
      score: 8,
      feedback: "Good answer",
      nextDifficulty: "medium",
      nextQuestionNumber: questionNumber + 1,
      nextQuestion: questions[questionNumber]
    });
  }

  // FINAL RESULT
  return res.json({
    completed: true,
    finalScore: 8,
    scores: [8, 8, 8, 8, 8],
    feedbacks: [
      "Good introduction",
      "Good strengths explanation",
      "Good self-awareness",
      "Good confidence",
      "Good career clarity"
    ]
  });
});

module.exports = router;