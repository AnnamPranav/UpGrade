import { InterviewManager } from "./agentManager.js";

async function runInterview() {
  console.log("🚀 Day 7 Interview Test\n");

  const interview = new InterviewManager("Frontend", "medium", 3);

  // Start
  let res = await interview.startInterview();
  console.log(`Q${res.questionNumber}:`, res.question);

  // Answer 1
  res = await interview.submitAnswer("Some frontend answer");
  console.log("\nResult 1:", res);

  // Answer 2
  res = await interview.submitAnswer("Another answer");
  console.log("\nResult 2:", res);

  // Answer 3
  res = await interview.submitAnswer("Final answer");
  console.log("\nFinal Result:", res);
}

runInterview();