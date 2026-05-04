import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { submitAnswer } from "../services/api";

function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const sessionId = localStorage.getItem("sessionId");

  const [question, setQuestion] = useState(location.state?.question || "");
  const [questionNumber, setQuestionNumber] = useState(
    location.state?.questionNumber || 1
  );
  const [difficulty, setDifficulty] = useState(
    location.state?.difficulty || "medium"
  );
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const totalQuestions = 5;
  const progressPercent = (questionNumber / totalQuestions) * 100;

  if (!sessionId || !question) {
    return (
      <div className="page">
        <div className="container">
          <h2>Interview session not found</h2>
          <p>Please start a new interview.</p>
          <button className="primary-btn" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!answer.trim()) {
      alert("Answer cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await submitAnswer(sessionId, answer);
      const data = res.data;

      if (data.completed) {
        setAnswer("");

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
        setAnswer("");
      }
    } catch (err) {
      alert("Error submitting answer. Please try again.");
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

        {loading && <div className="loader-box">Evaluating answer...</div>}

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