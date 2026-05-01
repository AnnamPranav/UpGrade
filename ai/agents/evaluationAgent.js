import { callAI } from "./aiService.js";
import { callWithRetry, smartFallbackEvaluation } from "./utils.js";

const MAX_LENGTH = 2000;

const EVALUATION_PROMPT = (question, answer) => `
Evaluate this answer.

Question:
${question}

Answer:
${answer}

Score (0–10):
0–2 incorrect or irrelevant
3–5 partially correct
6–7 mostly correct
8–9 strong answer
10 perfect answer

Rules:
- Judge correctness, clarity, and depth
- Penalize vague or off-topic answers
- Be consistent in scoring

Return ONLY JSON:
{
  "score": number,
  "feedback": "...",
  "strength": "...",
  "weakness": "..."
}
`;

export async function evaluateAnswer(question, answer) {
  // 🔒 Empty answer
  if (!answer || answer.trim() === "") {
    return formatEvaluation({
      score: 0,
      feedback: "No answer provided",
      strength: "No attempt",
      weakness: "Answer missing"
    });
  }

  // 🔒 Limit answer size
  if (answer.length > MAX_LENGTH) {
    answer = answer.slice(0, MAX_LENGTH);
  }

  // 🔒 Garbage input
  if (answer.length < 5 || /^[^a-zA-Z0-9]+$/.test(answer)) {
    return formatEvaluation({
      score: 1,
      feedback: "Answer is unclear or not meaningful",
      strength: "Attempt made",
      weakness: "Invalid or nonsensical input"
    });
  }

  const prompt = EVALUATION_PROMPT(question, answer);

  try {
    const data = await callWithRetry(
      prompt,
      "evaluation",
      callAI,
      { answer }
    );

    if (!isValidEvaluation(data)) {
      return formatEvaluation(smartFallbackEvaluation(answer));
    }

    data.score = Math.max(0, Math.min(10, data.score));

    console.log("[EVAL]", {
      score: data.score,
      answerLength: answer.length
    });

    return formatEvaluation(data);

  } catch (err) {
    console.error("Evaluation Error:", err.message);
    return formatEvaluation(smartFallbackEvaluation(answer));
  }
}

// ✅ Standard formatter
function formatEvaluation(data) {
  return {
    type: "evaluation",
    data
  };
}

// 🔒 Validation
function isValidEvaluation(data) {
  return (
    data &&
    typeof data.score === "number" &&
    typeof data.feedback === "string" &&
    typeof data.strength === "string" &&
    typeof data.weakness === "string"
  );
}