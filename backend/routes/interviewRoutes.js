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
    const first = await questionAgent("medium", 0, []);

    if (!first || !first.question) {
      return res.status(500).json({
        completed: false,
        message: "Failed to generate question"
      });
    }

    const newInterview = new Interview({
      sessionId: Date.now().toString(),
      currentQuestionIndex: 0,
      difficulty: first.difficulty,
      questions: [first.question],
      answers: [],
      scores: [],
      feedbacks: [],
      difficulties: [first.difficulty]
    });

    await newInterview.save();

    console.log("Session started:", newInterview.sessionId);

    return res.json({
      completed: false,
      sessionId: newInterview.sessionId,
      question: first.question,
      difficulty: first.difficulty
    });

  } catch (error) {
    console.log("Start error:", error.message);

    return res.status(500).json({
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

    const currentQuestion =
      interview.questions[interview.currentQuestionIndex] || "Question not available";

    const aiResult = await evaluationAgent(currentQuestion, answer);

    const score = typeof aiResult.score === "number" ? aiResult.score : 0;
    const feedback = aiResult.feedback || "No feedback provided";

    interview.answers.push(answer);
    interview.scores.push(score);
    interview.feedbacks.push(feedback);

    const nextDifficulty = getNextDifficulty(score);

    // NEXT QUESTION
    if (interview.answers.length < MAX_QUESTIONS) {
      const next = await questionAgent(
        nextDifficulty,
        interview.currentQuestionIndex + 1,
        interview.questions
      );

      if (!next || !next.question) {
        return res.status(500).json({
          completed: false,
          message: "Failed to generate next question"
        });
      }

      interview.currentQuestionIndex += 1;
      interview.questions.push(next.question);
      interview.difficulties.push(next.difficulty);

      await interview.save();

      return res.json({
        completed: false,
        score,
        feedback,
        nextquestion: next.question,
        difficulty: next.difficulty
      });
    }

    // FINAL RESULT
    const total = interview.scores.reduce((a, b) => a + b, 0);
    const finalScore = Number((total / MAX_QUESTIONS).toFixed(2));

    await interview.save();

    return res.json({
      completed: true,
      finalScore,
      results: interview.questions.map((q, i) => ({
  questionNumber: i + 1,   
  question: q,
  difficulty: interview.difficulties[i] || "medium",
  score: interview.scores[i] ?? 0,
  feedback: interview.feedbacks[i] || "No feedback"
}))
    });

  } catch (error) {
    console.log("Answer error:", error.message);

    return res.status(500).json({
      completed: false,
      message: "Error processing answer"
    });
  }
});

module.exports = router;
