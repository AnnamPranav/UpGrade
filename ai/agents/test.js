import { generateQuestion } from "./questionAgent.js";
import { evaluateAnswer } from "./evaluationAgent.js";

async function runTests() {
  console.log("🚀 Day 6 Testing...\n");

  const q = await generateQuestion("Frontend", "medium");
  console.log("Question:", q, "\n");

  // ❌ Empty answer
  const empty = await evaluateAnswer(q.question, "");
  console.log("Empty Answer:", empty);

  // ❌ Short answer
  const short = await evaluateAnswer(q.question, "I don't know");
  console.log("Short Answer:", short);

  // ⚠️ Medium answer
  const medium = await evaluateAnswer(
    q.question,
    "It is used in frontend development"
  );
  console.log("Medium Answer:", medium);

  // ✅ Long answer
  const long = await evaluateAnswer(
    q.question,
    "It is a JavaScript concept used to manage UI state, allowing dynamic updates and efficient rendering in frontend applications."
  );
  console.log("Long Answer:", long);
}

runTests();