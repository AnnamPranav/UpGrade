import { generateQuestion } from "./questionAgent.js";
import { evaluateAnswer } from "./evaluationAgent.js";

export async function runInterview(role, difficulty, userAnswer) {

  // Step 1: Get Question
  const questionData = await generateQuestion(role, difficulty);

  // If no answer yet → return question
  if (!userAnswer) {
    return {
      stage: "question",
      question: questionData.question
    };
  }

  // Step 2: Evaluate Answer
  const evaluation = await evaluateAnswer(
    questionData.question,
    userAnswer
  );

  return {
    stage: "evaluation",
    question: questionData.question,
    score: evaluation.score,
    feedback: evaluation.feedback
  };
}