import { generateQuestion } from "./questionAgent.js";
import { evaluateAnswer } from "./evaluationAgent.js";

export class InterviewManager {
  constructor(role, difficulty, totalQuestions = 8) {
    this.role = role;
    this.difficulty = difficulty;
    this.totalQuestions = totalQuestions;

    this.questions = [];
    this.answers = [];
    this.scores = [];
    this.evaluations = []; // ✅ ADD HERE
    this.currentQuestionIndex = 0;
  }

  // 🔥 Adaptive logic
  adjustDifficulty(score) {
    if (score <= 3) return "easy";
    if (score <= 7) return "medium";
    return "hard";
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
    
    this.evaluations.push(evaluation); // ✅ ADD HERE
    this.answers.push(answer);

    // ✅ SINGLE score extraction (FIXED)
    const score =
      evaluation?.data?.score !== undefined
        ? evaluation.data.score
        : 0;

    this.scores.push(score);

    // 🔥 Adaptive difficulty update
    this.difficulty = this.adjustDifficulty(score);

    console.log("New Difficulty:", this.difficulty); // moved BEFORE return

    if (this.currentQuestionIndex < this.totalQuestions) {
      let nextQuestion;
      let attempts = 0;

      do {
        nextQuestion = await generateQuestion(
          this.role,
          this.difficulty,
          this.questions
        );

        // 🔒 safe extraction
        nextQuestion.question =
          nextQuestion?.data?.question || nextQuestion.question;

        attempts++;

      } while (
        this.questions.includes(nextQuestion.question) &&
        attempts < 3
      );

      // 🔒 fallback if still duplicate
      if (this.questions.includes(nextQuestion.question)) {
        nextQuestion.question = `Explain a core ${this.role} concept.`;
      }

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
        ? Number((total / validScores.length).toFixed(1))
        : 0;

    return {
      totalScore: total,
      averageScore: avg,
      questions: this.questions,
      scores: validScores
    };
  }
}