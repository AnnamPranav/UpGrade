import { callAI } from "./aiService.js";
import { safeParseJSON } from "./utils.js";

// Prompt inside file
const EVALUATION_PROMPT = (question, answer) => `
You are an API that ONLY returns JSON.

Evaluate the candidate answer.

Question:
${question}

Answer:
${answer}

Rules:
- Score must be integer (0 to 10)
- Feedback must be short (1-2 lines)

STRICT INSTRUCTIONS:
- DO NOT explain anything
- DO NOT include markdown
- DO NOT include code
- DO NOT include text outside JSON

Return ONLY this format:

{
  "score": number,
  "feedback": "..."
}
`;

export async function evaluateAnswer(question, answer) {
  const prompt = EVALUATION_PROMPT(question, answer);

  const response = await callAI(prompt);

  const data = safeParseJSON(response);

  if (!data) {
    throw new Error("Invalid JSON from Evaluation Agent");
  }

  return data;
}