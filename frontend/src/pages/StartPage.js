import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startInterview } from "../services/api";

function StartPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await startInterview();
      const data = res.data;

      // Store session info
      localStorage.setItem("sessionId", data.sessionId);
      localStorage.setItem("questionNumber", data.questionNumber);

      navigate("/interview", {
        state: {
          question: data.question,
          questionNumber: data.questionNumber || 1,
          difficulty: data.difficulty || "medium",
        },
      });
    } catch (err) {
      setError("Something went wrong while starting the interview.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="hero-card">
        <h1>AI Interview Platform</h1>

        <p className="subtitle">
          Practice mock interviews with AI-generated questions and feedback.
        </p>

        {error && <div className="error-box">{error}</div>}

        {loading && (
          <div className="loader-box">
            Generating question...
          </div>
        )}

        <button
          className="primary-btn"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? "Starting..." : "Start Interview"}
        </button>
      </div>
    </div>
  );
}

export default StartPage;