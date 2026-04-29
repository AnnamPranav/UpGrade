import { callAI } from "./aiService.js";

// Prompt inside file
const EVALUATION_PROMPT = (question, answer) => `
You are an expert technical interviewer.

Evaluate the candidate's answer.

Question:
${question}

Answer:
${answer}

Rules:
- Score from 0 to 10
- Check correctness, clarity, depth
- Give short feedback

IMPORTANT:
Return ONLY valid JSON.

{
  "score": number,
  "feedback": "..."
}
`;

export async function evaluateAnswer(question, answer) {
  const prompt = EVALUATION_PROMPT(question, answer);

  const response = await callAI(prompt);

  console.log("Evaluation RAW:", response);

  try {
    return JSON.parse(response);
  } catch (err) {
    throw new Error("Invalid JSON from Evaluation Agent");
  }
}