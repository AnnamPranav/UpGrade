import { callAI } from "./aiService.js";
import { safeParseJSON, fallbackResponse } from "./utils.js";

export async function evaluateAnswer(question, answer) {
  const prompt = `
You are an API.

Evaluate the candidate answer.

Question:
${question}

Answer:
${answer}

Rules:
- Score must be integer (0 to 10)
- Feedback must be short (1-2 lines)

IMPORTANT:
Return ONLY valid JSON.
No explanation.
No markdown.

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