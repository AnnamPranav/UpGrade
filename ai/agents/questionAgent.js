import { callAI } from "./aiService.js";
import { safeParseJSON, fallbackResponse } from "./utils.js";

const QUESTION_PROMPT = (role, difficulty) => `
You are an API that generates interview questions.

Generate a ${difficulty} level interview question.

Role: ${role}

Difficulty Rules:
- easy → basic concepts
- medium → moderate reasoning
- hard → advanced concepts

Rules:
- Only ONE question
- No explanation
- No markdown

STRICT:
Return ONLY valid JSON.

{
  "question": "..."
}
`;

export async function generateQuestion(role, difficulty) {
  const prompt = QUESTION_PROMPT(role, difficulty);

  // 🔹 First attempt
  let response = await callAI(prompt);
  let data = safeParseJSON(response);

  // 🔥 Retry if invalid
  if (!data || typeof data.question !== "string") {
    response = await callAI(prompt);
    data = safeParseJSON(response);
  }

  // 🔥 Final fallback
  if (!data || typeof data.question !== "string") {
    return fallbackResponse("question");
  }

  return data;
}