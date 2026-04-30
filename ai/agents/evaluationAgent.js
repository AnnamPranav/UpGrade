import { callAI } from "./aiService.js";
import { safeParseJSON, fallbackResponse } from "./utils.js";

export async function evaluateAnswer(question, answer) {
  const prompt = `
You are an API that evaluates interview answers.

Question:
${question}

Answer:
${answer}

Scoring Rules:
- 0–2 → incorrect / irrelevant
- 3–5 → partially correct
- 6–8 → correct but incomplete
- 9–10 → correct and well explained

Rules:
- Score must be integer (0–10)
- Feedback must be short (1–2 lines)

STRICT:
- Return ONLY JSON
- No explanation
- No markdown

{
  "score": number,
  "feedback": "..."
}
`;

  const response = await callAI(prompt);

  const data = safeParseJSON(response);

  if (!data || data.score === undefined) {
    return fallbackResponse("evaluation");
  }

  return data;
}