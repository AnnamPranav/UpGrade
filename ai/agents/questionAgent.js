import { callAI } from "./aiService.js";
import { callWithRetry } from "./utils.js";

const QUESTION_PROMPT = (role, difficulty, previousQuestions) => `
Generate one ${difficulty} interview question.

Role: ${role}

Avoid repeating:
${previousQuestions.length ? previousQuestions.join("\n") : "None"}

Rules:
- Only ONE question
- Do NOT repeat or rephrase previous questions
- Keep it clear and concise

Return ONLY JSON:
{
  "question": "..."
}
`;

export async function generateQuestion(role, difficulty, previousQuestions = []) {
  const prompt = QUESTION_PROMPT(role, difficulty, previousQuestions);

  try {
    // 🔥 Centralized retry + validation
    const data = await callWithRetry(
      prompt,
      "question",
      callAI
    );

    // 🔒 Final validation (extra safety)
    if (!isValidQuestion(data)) {
      return smartFallbackQuestion();
    }

    // 📊 Logging (useful in production)
    console.log("[QUESTION]", {
      difficulty,
      length: data.question.length
    });

    return data;

  } catch (err) {
    console.error("Question Agent Error:", err.message);
    return smartFallbackQuestion();
  }
}

// 🔒 Strong validation
function isValidQuestion(data) {
  return (
    data &&
    typeof data.question === "string" &&
    data.question.trim().length > 10
  );
}

// 🔥 Smart fallback (better than generic)
function smartFallbackQuestion() {
  return {
    question: "Explain a key concept in your domain and how you would apply it in a real-world scenario."
  };
}