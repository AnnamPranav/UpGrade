import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { submitAnswer } from "../services/api";

function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const sessionId = localStorage.getItem("sessionId");

  const [question, setQuestion] = useState(location.state?.question || "");
  const [questionNumber, setQuestionNumber] = useState(
    Number(localStorage.getItem("questionNumber")) || 1
  );

  const [difficulty, setDifficulty] = useState(
    location.state?.difficulty || "medium"
  );

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalQuestions = 5;
  const progressPercent = (questionNumber / totalQuestions) * 100;

  if (!sessionId || !question) {
    return (
      <div className="page">
        <div className="container">
          <h2>Interview session not found</h2>

          <button
            className="primary-btn"
            onClick={() => navigate("/")}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setError("Answer cannot be empty.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await submitAnswer(sessionId, answer);
      const data = res.data;

      if (data.completed) {
        localStorage.removeItem("questionNumber");

        navigate("/result", {
          state: {
            finalScore: data.finalScore,
            scores: data.scores,
            feedbacks: data.feedbacks,
          },
        });
      } else {
        setQuestion(data.nextQuestion);
        setQuestionNumber(data.nextQuestionNumber);
        setDifficulty(data.nextDifficulty || "medium");

        localStorage.setItem(
          "questionNumber",
          data.nextQuestionNumber
        );

        setAnswer("");
      }
    } catch (err) {
      setError("Something went wrong while evaluating answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h2>AI Interview Platform</h2>

        <p className="progress-text">
          Question {questionNumber} / {totalQuestions}
        </p>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <p className="difficulty-badge">
          Difficulty: <strong>{difficulty}</strong>
        </p>

        <div className="question-box">
          <p>{question}</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading && (
          <div className="loader-box">
            Evaluating answer...
          </div>
        )}

        <textarea
          placeholder="Type your answer here..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={6}
          disabled={loading}
        />

        <button
          className="primary-btn"
          onClick={handleSubmit}
          disabled={!answer.trim() || loading}
        >
          {loading ? "Evaluating..." : "Submit Answer"}
        </button>
      </div>
    </div>
  );
}

export default InterviewPage;