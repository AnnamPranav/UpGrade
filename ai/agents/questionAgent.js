import { callAI } from "./aiService.js";

// Prompt inside file
const QUESTION_PROMPT = (role, difficulty) => `
You are a technical interviewer.

Generate ONE interview question based on:
- Role: ${role}
- Difficulty: ${difficulty}

Rules:
- Ask only ONE question
- Do NOT give answer
- Keep it clear

IMPORTANT:
Return ONLY valid JSON. No extra text.

{
  "question": "..."
}
`;

export async function generateQuestion(role, difficulty) {
  const prompt = QUESTION_PROMPT(role, difficulty);

  const response = await callAI(prompt);

  console.log("Question RAW:", response);

  try {
    return JSON.parse(response);
  } catch (err) {
    throw new Error("Invalid JSON from Question Agent");
  }
}