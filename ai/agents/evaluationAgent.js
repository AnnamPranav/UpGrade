import { callAI } from "./aiService.js";
import { safeParseJSON, fallbackResponse } from "./utils.js";

const EVALUATION_PROMPT = (question, answer) => `
You are a strict but fair interview evaluator.

Question:
${question}

Candidate Answer:
${answer}

Evaluation Logic:

Step 1: Relevance
- If answer is unrelated → score 0–2

Step 2: If relevant, evaluate quality:
- 3–5 → basic / incomplete
- 6–7 → correct but lacks depth
- 8–9 → strong and well explained
- 10 → complete and precise

Important Rules:
- Do NOT give same score for different quality answers
- Strong answers MUST score higher than average answers
- Only give 8+ if explanation is detailed and clear
- Reward correct ideas even if not perfect

Output Rules:
- Return ONLY JSON
- No explanation outside JSON

{
  "score": number,
  "feedback": "..."
}
`;

export async function evaluateAnswer(question, answer) {
  const prompt = EVALUATION_PROMPT(question, answer);

  let response = await callAI(prompt);
  let data = safeParseJSON(response);

  // Retry once
  if (
    !data ||
    typeof data.score !== "number" ||
    typeof data.feedback !== "string"
  ) {
    response = await callAI(prompt);
    data = safeParseJSON(response);
  }

  // Final fallback
  if (
    !data ||
    typeof data.score !== "number" ||
    typeof data.feedback !== "string"
  ) {
    return fallbackResponse("evaluation");
  }

  return data;
}