import { generateQuestion } from "./questionAgent.js";
import { evaluateAnswer } from "./evaluationAgent.js";

async function run() {
  console.log("🚀 Day 3 Testing...");

  // Step 1: Generate Question
  const q = await generateQuestion("Frontend", "easy");
  console.log("Question:", q);

  // Step 2: Evaluate Answer
  const evalRes = await evaluateAnswer(
    q.question,
    "React is a JavaScript library used for building UI"
  );

  console.log("Evaluation:", evalRes);
}

run();