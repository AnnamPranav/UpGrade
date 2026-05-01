import { generateQuestion } from "./questionAgent.js";
import { evaluateAnswer } from "./evaluationAgent.js";

export class InterviewManager {
  constructor(role, difficulty, totalQuestions = 3) {
    this.role = role;
    this.difficulty = difficulty;
    this.totalQuestions = totalQuestions;

    this.questions = [];
    this.answers = [];
    this.scores = [];
    this.currentQuestionIndex = 0;
  }

  async startInterview() {
    const q = await generateQuestion(
      this.role,
      this.difficulty,
      this.questions
    );

    const questionText = q?.data?.question || q.question;

    this.questions.push(questionText);
    this.currentQuestionIndex = 1;

    return {
      question: questionText,
      questionNumber: this.currentQuestionIndex
    };
  }

  async submitAnswer(answer) {
    const currentQuestion =
      this.questions[this.currentQuestionIndex - 1];

    const evaluation = await evaluateAnswer(currentQuestion, answer);

    this.answers.push(answer);

    const score =
      evaluation?.data?.score !== undefined
        ? evaluation.data.score
        : 0;

    this.scores.push(score);

    if (this.currentQuestionIndex < this.totalQuestions) {
      let nextQuestion;
      let attempts = 0;

      do {
        nextQuestion = await generateQuestion(
          this.role,
          this.difficulty,
          this.questions
        );
        attempts++;
      } while (
        this.questions.includes(nextQuestion.question) &&
        attempts < 3
      );

      this.questions.push(nextQuestion.question);
      this.currentQuestionIndex++;

      return {
        stage: "next-question",
        evaluation,
        question: nextQuestion.question,
        questionNumber: this.currentQuestionIndex
      };
    }

    return {
      stage: "completed",
      result: this.getFinalResult(),
      lastEvaluation: evaluation
    };
  }

  getFinalResult() {
    const validScores = this.scores.filter(
      s => typeof s === "number"
    );

    const total = validScores.reduce((a, b) => a + b, 0);

    const avg =
      validScores.length > 0
        ? Math.round(total / validScores.length)
        : 0;

    return {
      totalScore: total,
      averageScore: avg,
      questions: this.questions,
      scores: validScores
    };
  }
}