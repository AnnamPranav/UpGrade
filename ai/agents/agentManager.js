import { generateQuestion } from "./questionAgent.js";
import { evaluateAnswer } from "./evaluationAgent.js";

export class InterviewManager {
  constructor(role, difficulty, totalQuestions = 3) {
    this.role = role;
    this.difficulty = difficulty;
    this.totalQuestions = totalQuestions;

    this.currentQuestionIndex = 0;
    this.questions = [];
    this.answers = [];
    this.scores = [];
  }

  // 🔹 Start Interview
  async startInterview() {
    const question = await generateQuestion(this.role, this.difficulty);

    this.questions.push(question.question);
    this.currentQuestionIndex = 1;

    return {
      question: question.question,
      questionNumber: this.currentQuestionIndex
    };
  }

  // 🔹 Submit Answer
  async submitAnswer(answer) {
    const currentQuestion =
      this.questions[this.currentQuestionIndex - 1];

    const evaluation = await evaluateAnswer(currentQuestion, answer);

    this.answers.push(answer);
    this.scores.push(evaluation.score);

    // If more questions left
    if (this.currentQuestionIndex < this.totalQuestions) {
      const nextQuestion = await generateQuestion(
        this.role,
        this.difficulty,
        this.questions
);

      this.questions.push(nextQuestion.question);
      this.currentQuestionIndex++;

      return {
        stage: "next-question",
        evaluation: evaluation,
        nextQuestion: nextQuestion.question,
        questionNumber: this.currentQuestionIndex
};
    }

    // 🔥 Interview Complete
    return {
      stage: "completed",
      result: this.getFinalResult(),
      lastEvaluation: evaluation
    };
  }

  // 🔹 Final Result
  getFinalResult() {
    const total = this.scores.reduce((a, b) => a + b, 0);
    const average = total / this.scores.length;

    return {
      totalScore: total,
      averageScore: Math.round(average),
      questions: this.questions,
      scores: this.scores
    };
  }
}