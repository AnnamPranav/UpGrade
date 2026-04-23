const express = require("express");
const router = express.Router();
const Interview = require("../models/interview");

// START INTERVIEW
router.get("/start", async (req, res) => {

  const question = "Tell me about yourself";

  const newInterview = new Interview({
    sessionId: Date.now().toString(),
    questions: [question],
    answers: [],
    scores: []
  });

  await newInterview.save();

  res.json({
    sessionId: newInterview.sessionId,
    question: question
  });
});


// ANSWER API
router.post("/answer", async (req, res) => {

  const { sessionId, answer } = req.body;

  const interview = await Interview.findOne({ sessionId });

  if (!interview) {
    return res.json({ message: "Session not found" });
  }

  const score = 7;
  const feedback = "Good answer, improve clarity";

  interview.answers.push(answer);
  interview.scores.push(score);

  await interview.save();

  res.json({
    score,
    feedback
  });
});

module.exports = router;
