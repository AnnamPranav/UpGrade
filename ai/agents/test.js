import { generateQuestion } from "./questionAgent.js";
import { evaluateAnswer } from "./evaluationAgent.js";

async function run() {
  console.log("🚀 Testing prompts...");

  const q = await generateQuestion("Frontend", "easy");
  console.log("Question:", q);

  const result = await evaluateAnswer(
    q.question,
    "API is interface"
  );

  console.log("Evaluation (PARSED):", result);
}

run();