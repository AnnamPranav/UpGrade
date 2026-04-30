import { generateQuestion } from "./questionAgent.js";
import { evaluateAnswer } from "./evaluationAgent.js";

async function runTests() {
  console.log("🚀 Final Test...\n");

  const q = await generateQuestion("Frontend", "medium");
  console.log("Question:", q, "\n");

  // ❌ Bad answer
  const bad = await evaluateAnswer(q.question, "I don't know");
  console.log("Bad Answer:", bad);

  // ⚠️ Average answer
  const avg = await evaluateAnswer(
    q.question,
    "It is used in frontend applications"
  );
  console.log("Average Answer:", avg);

  // ✅ Strong answer (proper one)
  const good = await evaluateAnswer(
    q.question,
    "This can be implemented by filtering a predefined list based on user input using string matching. We can use debouncing to optimize performance and display top suggestions dynamically as the user types."
  );
  console.log("Strong Answer:", good);
}

runTests();