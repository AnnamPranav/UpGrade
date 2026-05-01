import { InterviewManager } from "./agentManager.js";

async function runFinalTest() {
  console.log("🚀 FINAL SYSTEM TEST (Stress Testing)\n");

  const interview = new InterviewManager("Frontend", "medium", 3);

  // Start interview
  let res = await interview.startInterview();
  console.log(`Q${res.questionNumber}:`, res.question);

  // ❌ 1. Empty Answer Test
  console.log("\n--- Empty Answer Test ---");
  res = await interview.submitAnswer("");
  console.log(res);

  // ❌ 2. Random Garbage Test
  console.log("\n--- Garbage Input Test ---");
  res = await interview.submitAnswer("asdfgh123!@#$$%");
  console.log(res);

  // ❌ 3. Very Long Answer Test
  console.log("\n--- Long Answer Test ---");

  const longAnswer = `
  React performance optimization includes memoization, code splitting,
  lazy loading, virtualization, avoiding unnecessary re-renders,
  using React.memo, useCallback, useMemo, and optimizing state structure.
  Also using pagination and caching strategies improves performance significantly.
  `.repeat(5); // simulate long input

  res = await interview.submitAnswer(longAnswer);
  console.log(res);
}

runFinalTest();