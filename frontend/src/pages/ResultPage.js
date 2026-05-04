import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!location.state) {
    return (
      <div className="page">
        <div className="container">
          <h2>No result found</h2>
          <p>Please complete an interview first.</p>
          <button className="primary-btn" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { finalScore = 0, scores = [], feedbacks = [] } = location.state;

  const getLevel = () => {
    if (finalScore >= 8) return "Advanced";
    if (finalScore >= 4) return "Intermediate";
    return "Basic";
  };

  return (
    <div className="page">
      <div className="container result-container">
        <h1>Final Interview Result</h1>

        <div className="score-card">
          <h2>{finalScore.toFixed(2)} / 10</h2>
          <p className="level">Skill Level: {getLevel()}</p>
        </div>

        <h3>Question-wise Scores</h3>
        {scores.length > 0 ? (
          scores.map((score, index) => (
            <div className="result-item" key={index}>
              <strong>Question {index + 1}</strong>
              <span>{score}/10</span>
            </div>
          ))
        ) : (
          <p>No scores available.</p>
        )}

        <h3>Feedback Per Question</h3>
        {feedbacks.length > 0 ? (
          feedbacks.map((feedback, index) => (
            <div className="feedback-card" key={index}>
              <strong>Question {index + 1}</strong>
              <p>{feedback}</p>
            </div>
          ))
        ) : (
          <p>No feedback available.</p>
        )}

        <div className="button-row">
          <button className="primary-btn" onClick={() => navigate("/")}>
            Restart Interview
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultPage;