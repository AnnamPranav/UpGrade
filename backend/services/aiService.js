const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function questionAgent(difficulty = "medium") {
  try {
    throw new Error("Using fallback questions");

  } catch (error) {
    const questions = {
      easy: [
        "Tell me about yourself.",
        "What are your strengths?",
        "Why do you want this job?"
      ],
      medium: [
        "Explain one project you developed recently.",
        "How do you handle pressure during work?",
        "Tell me about a challenging project you worked on."
      ],
      hard: [
        "How would you design a scalable backend system?",
        "Explain how you would optimize a slow API.",
        "How do you handle database performance issues?"
      ]
    };

    const list = questions[difficulty] || questions.medium;
    return list[Math.floor(Math.random() * list.length)];
  }
}

function calculateScore(answer) {
  let score = 0;

  if (!answer || answer.trim() === "") return 0;

  const lowerAnswer = answer.toLowerCase();
  const wordCount = answer.trim().split(/\s+/).length;

  if (wordCount >= 10) score += 2;
  if (wordCount >= 25) score += 2;

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

  if (answer.length > 50 && answer.includes(".")) {
    score += 2;
  }

  return Math.min(score, 10);
}

async function evaluationAgent(question, answer) {
  try {
    const score = calculateScore(answer);

    let feedback;

    if (score > 7) {
      feedback = "Excellent answer. You explained clearly with good confidence and examples.";
    } else if (score >= 4) {
      feedback = "Good answer, but improve clarity and add more real examples.";
    } else {
      feedback = "Answer is too short. Try to explain with examples, achievements, and confidence.";
    }

    return {
      score,
      feedback
    };

  } catch (error) {
    return {
      score: 0,
      feedback: "AI evaluation failed. Please try again with a clear answer."
    };
  }
}

module.exports = { questionAgent, evaluationAgent };
