const express = require("express");
const router = express.Router();
const Interview = require("../models/Interview");
const { questionAgent, evaluationAgent } = require("../services/aiService");

const MAX_QUESTIONS = 5;

function getNextDifficulty(score) {
  if (score > 7) return "hard";
  if (score < 4) return "easy";
  return "medium";
}

// START INTERVIEW
router.get("/start", async (req, res) => {
  try {
    const difficulty = "medium";
    const firstQuestion = await questionAgent(difficulty);

    if (!firstQuestion) {
      return res.status(500).json({
        completed: false,
        message: "Failed to generate first question"
      });
    }

    const newInterview = new Interview({
      sessionId: Date.now().toString(),
      currentQuestionIndex: 0,
      difficulty,
      questions: [firstQuestion],
      answers: [],
      scores: [],
      feedbacks: [],
      difficulties: [difficulty]
    });

    await newInterview.save();

    res.json({
      completed: false,
      sessionId: newInterview.sessionId,
      questionNumber: 1,
      difficulty,
      question: firstQuestion
    });

  } catch (error) {
    res.status(500).json({
      completed: false,
      message: "Error starting interview"
    });
  }
});

// ANSWER API
router.post("/answer", async (req, res) => {
  try {
    const { sessionId, answer } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        completed: false,
        message: "sessionId is required"
      });
    }

    if (!answer || answer.trim() === "") {
      return res.status(400).json({
        completed: false,
        message: "Answer cannot be empty"
      });
    }

    const interview = await Interview.findOne({ sessionId });

    if (!interview) {
      return res.status(404).json({
        completed: false,
        message: "Session not found"
      });
    }

    if (interview.answers.length >= MAX_QUESTIONS) {
      const finalScore =
        interview.scores.slice(0, MAX_QUESTIONS).reduce((sum, s) => sum + s, 0) /
        MAX_QUESTIONS;

      return res.json({
        completed: true,
        message: "Interview already completed",
        finalScore,
        feedbacks: interview.feedbacks.slice(0, MAX_QUESTIONS)
      });
    }

    const currentQuestion =
      interview.questions[interview.currentQuestionIndex] || "Interview question missing";

    const aiResult = await evaluationAgent(currentQuestion, answer);

    const score =
      typeof aiResult.score === "number" ? aiResult.score : 0;

    const feedback =
      aiResult.feedback || "No feedback generated.";

    const nextDifficulty = getNextDifficulty(score);

    interview.answers.push(answer);
    interview.scores.push(score);
    interview.feedbacks.push(feedback);
    interview.difficulty = nextDifficulty;

    if (interview.answers.length < MAX_QUESTIONS) {
      const nextQuestion = await questionAgent(nextDifficulty);

      if (!nextQuestion) {
        return res.status(500).json({
          completed: false,
          message: "Failed to generate next question"
        });
      }

      interview.currentQuestionIndex += 1;
      interview.questions.push(nextQuestion);
      interview.difficulties.push(nextDifficulty);

      await interview.save();

      return res.json({
        completed: false,
        score,
        feedback,
        nextDifficulty,
        nextQuestionNumber: interview.currentQuestionIndex + 1,
        nextQuestion
      });
    }

    const finalScore =
      interview.scores.slice(0, MAX_QUESTIONS).reduce((sum, s) => sum + s, 0) /
      MAX_QUESTIONS;

    await interview.save();

    res.json({
      completed: true,
      finalScore,
      scores: interview.scores.slice(0, MAX_QUESTIONS),
      feedbacks: interview.feedbacks.slice(0, MAX_QUESTIONS)
    });

  } catch (error) {
    res.status(500).json({
      completed: false,
      message: "Error processing answer"
    });
  }
});

module.exports = router;
