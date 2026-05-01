export function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function parseAndValidate(text, type) {
  const data = safeParseJSON(text);
  if (!data) return null;

  if (type === "question") {
    if (typeof data.question === "string") return data;
  }

  if (type === "evaluation") {
    if (
      typeof data.score === "number" &&
      typeof data.feedback === "string" &&
      typeof data.strength === "string" &&
      typeof data.weakness === "string"
    ) {
      return data;
    }
  }

  return null;
}

export function fallbackResponse(type) {
  if (type === "question") {
    return { question: "Unable to generate question. Try again." };
  }
}

export function smartFallbackEvaluation(answer) {
  if (!answer || answer.trim() === "") {
    return {
      score: 0,
      feedback: "No answer provided",
      strength: "No attempt",
      weakness: "Missing answer"
    };
  }

  if (answer.length < 10) {
    return {
      score: 2,
      feedback: "Very limited answer",
      strength: "Attempt made",
      weakness: "Lacks detail"
    };
  }

  return {
    score: 5,
    feedback: "Average response",
    strength: "Basic understanding",
    weakness: "Needs improvement"
  };
}

export async function callWithRetry(prompt, type, callAI, context = {}) {
  try {
    let response = await callAI(prompt);
    let data = parseAndValidate(response, type);

    if (data) return data;

    // retry
    response = await callAI(prompt);
    data = parseAndValidate(response, type);

    if (data) return data;

    if (type === "evaluation") {
      return smartFallbackEvaluation(context.answer);
    }

    return fallbackResponse(type);

  } catch (err) {
    console.error("AI Error:", err.message);

    if (type === "evaluation") {
      return smartFallbackEvaluation(context.answer);
    }

    return fallbackResponse(type);
  }
}