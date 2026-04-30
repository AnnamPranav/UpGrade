import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const NIM_API_KEY = process.env.NIM_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * MAIN FUNCTION
 * Tries NVIDIA NIM first → fallback to OpenAI
 */
export async function callAI(prompt) {
  try {
    const response = await callNIM(prompt);
    console.log("Using NIM ONLY ✅");
    return response;
  } catch (err) {
    console.log("NIM failed ❌");

    return JSON.stringify({
      error: "AI service unavailable"
    });
  }
}

/**
 * NVIDIA NIM (Gemma / LLM API)
 */
async function callNIM(prompt) {
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NIM_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "meta/llama-3.1-8b-instruct", // ✅ more stable model
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    })
  });

  const text = await response.text();

  if (!response.ok) {
  console.error("NIM RAW ERROR:", text);

  // return fallback JSON instead of crashing
  return JSON.stringify({
    error: "NIM API failed"
  });
}

  const data = JSON.parse(text);

  return data.choices[0].message.content;
}
/**
 * OpenAI Fallback
 */
async function callOpenAI(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // cheaper + good
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();

  return data.choices[0].message.content;
}