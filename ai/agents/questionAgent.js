import { callAI } from "./aiService.js";
import { safeParseJSON, fallbackResponse } from "./utils.js";

export async function generateQuestion(role, difficulty) {
  const prompt = `
You are an API.

Generate ONE interview question.

Role: ${role}
Difficulty: ${difficulty}

Rules:
- Only 1 question
- No explanation
- No code

IMPORTANT:
Return ONLY valid JSON.
No extra text.

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