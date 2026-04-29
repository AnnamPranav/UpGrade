import { callAI } from "./aiService.js";
import { extractJSON } from "./utils.js";

async function testAPI() {
  console.log("🚀 Starting test...");

  try {
    const response = await callAI(`
Return ONLY valid JSON.
Do NOT add explanation.
Do NOT add code.

{
  "status": "ok"
}
`);

    console.log("RAW RESPONSE:", response);

    const data = extractJSON(response);

    console.log("PARSED JSON:", data);

  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

testAPI();