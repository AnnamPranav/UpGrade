import { callAI } from "./aiService.js";
import { safeParseJSON, fallbackResponse } from "./utils.js";

export async function generateQuestion(role, difficulty) {
  const prompt = `
You are an API that generates interview questions.

Role: ${role}
Difficulty: ${difficulty}

Difficulty Rules:
- easy → basic concepts, definitions
- medium → practical + moderate logic
- hard → advanced concepts, problem-solving

Rules:
- Only ONE question
- No explanation
- No code unless required
- Keep it relevant to role

STRICT:
- Return ONLY valid JSON
- No extra text
- No markdown

{
  "question": "..."
}
`;

  const response = await callAI(prompt);

  const data = safeParseJSON(response);

  if (!data || !data.question) {
    return fallbackResponse("question");
  }

  return data;
}