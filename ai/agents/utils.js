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

// 🔒 Safe defaults (Day 6 requirement)
export function safeDefaultEvaluation() {
  return {
    score: 5,
    feedback: "Average response"
  };
}

export function fallbackResponse(type) {
  if (type === "question") {
    return { question: "Unable to generate question. Please try again." };
  }
  if (type === "evaluation") {
    return safeDefaultEvaluation();
  }
}