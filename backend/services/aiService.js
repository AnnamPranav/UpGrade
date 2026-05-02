// QUESTION AGENT (mixed + no repeat + adaptive)
async function questionAgent(difficulty = "medium", questionIndex = 0, usedQuestions = []) {
  const questions = {
    easy: [
      "Tell me about yourself.",
      "What are your strengths?",
      "Why do you want this job?",
      "What are your career goals?",
      "What skills do you have?"
    ],
       medium: [
      "Explain one project you developed recently.",
      "How do you handle pressure during work?",
      "Tell me about a challenging project you worked on.",
      "How do you work in a team?",
      "How do you solve problems during development?"
    ],
    hard: [
      "How would you design a scalable backend system?",
      "Explain how you would optimize a slow API.",
      "How do you handle database performance issues?",
      "How would you secure user data in a backend application?",
      "How would you handle high traffic in your application?"
    ]

  };

  let level;

  // Base mix
  if (questionIndex === 0) level = "easy";
  else if (questionIndex == 1 || questionIndex == 2) level = "medium";
  else level = "hard";

  // Adaptive override
  if (questionIndex > 0) {
    if (difficulty === "easy") level = "easy";
    else if (difficulty === "hard") level = "hard";
    else level = "medium";
  }

  let list = questions[level];

  // Remove repeated questions
  const filtered = list.filter(q => !usedQuestions.includes(q));
  const finalList = filtered.length > 0 ? filtered : list;

  const selected = finalList[Math.floor(Math.random() * finalList.length)];

  return {
    question: selected,
    difficulty: level
  };
}

// EVALUATION AGENT
async function evaluationAgent(question, answer) {
  let score = 0;

  if (!answer || answer.trim() === "") {
    return {
      score: 0,
      feedback: "Answer cannot be empty."
    };
  }

  const cleanAnswer = answer.trim();
  const lowerAnswer = cleanAnswer.toLowerCase();
  const wordCount = cleanAnswer.split(/\s+/).length;

  if (wordCount >= 8) score += 2;
  if (wordCount >= 20) score += 2;

  const actionWords = [
    "developed", "created", "implemented", "designed",
    "solved", "managed", "improved", "built", "optimized"
  ];

  if (actionWords.some(word => lowerAnswer.includes(word))) {
    score += 2;
  }

  const exampleWords = [
    "project", "example", "experience", "team",
    "problem", "solution", "api", "database"
  ];

  if (exampleWords.some(word => lowerAnswer.includes(word))) {
    score += 2;
  }

  if (cleanAnswer.length > 40) score += 1;
  if (cleanAnswer.includes(".")) score += 1;

  score = Math.min(score, 10);

  let feedback;

  if (score > 7) {
    feedback = "Excellent answer. You explained clearly with confidence and examples.";
  } else if (score >= 4) {
    feedback = "Good answer, but improve clarity and add more examples.";
  } else {
    feedback = "Answer is too short. Add examples and explanation.";
  }

  return { score, feedback };
}

module.exports = { questionAgent, evaluationAgent };
