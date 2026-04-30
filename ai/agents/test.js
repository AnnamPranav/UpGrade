import { generateQuestion } from "./questionAgent.js";
import { evaluateAnswer } from "./evaluationAgent.js";

async function testDifficulty() {
  console.log("🚀 Testing Difficulty Levels...\n");

  const easy = await generateQuestion("Frontend", "easy");
  console.log("Easy:", easy);

  const medium = await generateQuestion("Frontend", "medium");
  console.log("Medium:", medium);

  const hard = await generateQuestion("Frontend", "hard");
  console.log("Hard:", hard);
}

testDifficulty();

async function testEvaluation() {
  const question = "What is JavaScript?";

  const bad = await evaluateAnswer(question, "I don't know");
  console.log("Bad Answer:", bad);

  const medium = await evaluateAnswer(question, "JS is a programming language");
  console.log("Medium Answer:", medium);

  const good = await evaluateAnswer(
    question,
    "JavaScript is a scripting language used for web development, enabling dynamic content"
  );
  console.log("Good Answer:", good);
}

testEvaluation();