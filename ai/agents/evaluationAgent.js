import { callAI } from "./aiService.js";
import { safeParseJSON, fallbackResponse, safeDefaultEvaluation } from "./utils.js";

const EVALUATION_PROMPT = (question, answer) => `
You are an API that evaluates interview answers.

Question:
${question}

Answer:
${answer}

Scoring (STRICT 0–10):

- 0–2 → completely incorrect or irrelevant
- 3–5 → partially correct but missing key concepts
- 6–7 → mostly correct but lacks depth or specificity
- 8–9 → correct with clear explanation and relevant details
- 10 → fully correct, precise, and well-structured

Evaluation Rules:
- Focus only on correctness, clarity, and depth
- Penalize vague or generic answers
- Penalize answers that do not directly address the question
- Do NOT assume intent
- Do NOT reward irrelevant but well-written answers

IMPORTANT:
- Do NOT consider whether the answer is AI-generated or human-generated
- Judge only based on content quality
- Be consistent in scoring

STRICT:
Return ONLY valid JSON.

{
  "score": number,
  "feedback": "..."
}
`;

export async function evaluateAnswer(question, answer) {
  // 🔒 Handle empty answers immediately
  if (!answer || answer.trim().length === 0) {
    return {
      score: 0,
      feedback: "No answer provided"
    };
  }

  const prompt = EVALUATION_PROMPT(question, answer);

  try {
    // First attempt
    let response = await callAI(prompt);
    let data = safeParseJSON(response);

    // Retry once if invalid
    if (!data || typeof data.score !== "number") {
      response = await callAI(prompt);
      data = safeParseJSON(response);
    }

    // Final validation
    if (!data || typeof data.score !== "number") {
      return safeDefaultEvaluation(); // 🔥 REQUIRED BY DAY 6
    }

    if (data.score < 0) data.score = 0;
    if (data.score > 10) data.score = 10;

    return data;

  } catch (err) {
    console.error("Evaluation Error:", err.message);
    return safeDefaultEvaluation();
  }
}