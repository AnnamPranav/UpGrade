const express = require("express");
const router = express.Router();

// START INTERVIEW
router.post("/start", (req, res) => {
  res.json({
    question: "Tell me about yourself",
  });
});

// SUBMIT ANSWER
router.post("/answer", (req, res) => {
  res.json({
    score: 8,
    feedback: "Good answer",
  });
});

module.exports = router;