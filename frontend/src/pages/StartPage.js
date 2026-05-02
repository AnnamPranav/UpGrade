import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startInterview } from "../services/api";

function StartPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await startInterview();
      const data = res.data;

      localStorage.setItem("sessionId", data.sessionId);

      navigate("/interview", {
        state: {
          question: data.question,
          questionNumber: data.questionNumber || 1,
          difficulty: data.difficulty || "medium",
        },
      });
    } catch (err) {
      alert("Failed to start interview. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="hero-card">
        <h1>AI Interview Platform</h1>
        <p className="subtitle">
          Practice a 5-question mock interview and receive instant AI feedback.
        </p>

        <div className="features">
          <span>AI Questions</span>
          <span>Adaptive Difficulty</span>
          <span>Final Feedback</span>
        </div>

        {loading && <div className="loader-box">Generating question...</div>}

        <button className="primary-btn" onClick={handleStart} disabled={loading}>
          {loading ? "Generating..." : "Start Interview"}
        </button>
      </div>
    </div>
  );
}

export default StartPage;