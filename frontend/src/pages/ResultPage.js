import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const result = location.state || {};

  const finalScore = result.finalScore || 0;
  const scores = result.scores || [];
  const feedbacks = result.feedbacks || [];

  let level = "Beginner";

  if (finalScore >= 8) {
    level = "Advanced";
  } else if (finalScore >= 5) {
    level = "Intermediate";
  }

  return (
    <div className="page">
      <div className="container">

        <h1>Final Interview Result</h1>

        <div className="score-box">
          <h2>{finalScore.toFixed(2)} / 10</h2>
          <p>Skill Level: {level}</p>
        </div>

        <h3>Question-wise Scores</h3>

        <div className="result-list">
          {scores.map((score, index) => (
            <div key={index} className="result-item">
              <span>Question {index + 1}</span>
              <span>{score}/10</span>
            </div>
          ))}
        </div>

        <h3>Feedback Per Question</h3>

        <div className="feedback-list">
          {feedbacks.map((feedback, index) => (
            <div key={index} className="feedback-card">
              <h4>Question {index + 1}</h4>
              <p>{feedback}</p>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            marginTop: "20px"
          }}
        >
          <button
            className="restart-btn"
            onClick={() => navigate("/")}
          >
            Restart Interview
          </button>

          <button
            className="restart-btn"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}

export default ResultPage;