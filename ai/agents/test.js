import { InterviewManager } from "./agentManager.js";

async function runAdaptiveTest() {
  console.log("🚀 ADAPTIVE INTERVIEW TEST (FINAL REPORT MODE)\n");

  const interview = new InterviewManager("Frontend", "medium", 8);

  let res = await interview.startInterview();

  let currentQuestion = res.question;

  console.log(`Q1: ${currentQuestion}\n`);

  const answers = [
  "", // ❌ very bad → easy

  // ❌ BAD (keeps easy)
  "I am not sure about exact difference but they are variables in JavaScript.",

  // ⚠️ MEDIUM (moves to medium)
  "Synchronous code executes line by line, while asynchronous code allows non-blocking execution like API calls using async/await or promises.",

  // ⚠️ MEDIUM+
  "A class is a blueprint for creating objects with constructors and methods, while functions are reusable blocks of code. Classes are preferred in OOP-based design systems.",

  // ⚠️ MEDIUM → HARD transition
  "The 'this' keyword refers to the execution context and changes based on how a function is called, while window is the global object in browsers.",

  // ✅ STRONG (should push to hard)
  "The DOM represents the structure of a web page as a tree, allowing JavaScript to dynamically manipulate elements using APIs like querySelector and event listeners.",

  // 🔥 HARD LEVEL ANSWER
  "For large datasets, use virtualization libraries like react-window to render only visible elements, combined with lazy loading and memoization to reduce re-renders and improve performance.",

  // 🔥 VERY HARD (deep + tools + metrics)
  "Use virtualization, memoization, and lazy loading together. Measure performance using React DevTools profiler, Lighthouse, and browser performance tab to identify bottlenecks and optimize rendering."
];

  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];

    console.log(`Answer ${i + 1}:`, answer || "[EMPTY]");

    res = await interview.submitAnswer(answer);

    if (res.stage === "next-question") {
      currentQuestion = res.question;
      console.log(`Q${i + 2}: ${currentQuestion}\n`);
    } else {
      // 🎯 FINAL REPORT ONLY HERE
      console.log("\n🎯 FINAL RESULT\n");
      console.log(res.result);

      console.log("\n📊 FULL INTERVIEW REPORT\n");

      interview.questions.forEach((q, index) => {
  const evalData = interview.evaluations[index]?.data || {
    score: interview.scores[index] || 0,
    feedback: "No evaluation available",
    strength: "N/A",
    weakness: "N/A"
  };

  console.log(`Q${index + 1}: ${q}`);
  console.log(`A${index + 1}: ${interview.answers[index] || "[EMPTY]"}`);
  console.log(`Score: ${evalData.score}`);
  console.log(`Feedback: ${evalData.feedback}`);
  console.log(`Strength: ${evalData.strength}`);
  console.log(`Weakness: ${evalData.weakness}`);
  console.log("------------------------------------------------\n");
});
    }
  }
}

runAdaptiveTest();