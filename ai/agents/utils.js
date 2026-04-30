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

export function fallbackResponse(type) {
  if (type === "question") {
    return {
      question: "Unable to generate question. Please try again."
    };
  }

  if (type === "evaluation") {
    return {
      score: 0,
      feedback: "Evaluation failed. Please try again."
    };
  }
}