import { callAI } from "./aiService.js";
import { safeParseJSON, fallbackResponse } from "./utils.js";

const QUESTION_PROMPT = (role, difficulty, previousQuestions) => `
You are an API that generates interview questions.

Generate a ${difficulty} level interview question.

Role: ${role}

Previous Questions:
${previousQuestions.length ? previousQuestions.join("\n") : "None"}

IMPORTANT:
- Do NOT repeat or rephrase previous questions
- Generate a completely new concept

Rules:
- Only ONE question
- No explanation

Return ONLY JSON:
{
  "question": "..."
}
`;

export async function generateQuestion(role, difficulty, previousQuestions = []) {
  const prompt = QUESTION_PROMPT(role, difficulty, previousQuestions);

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