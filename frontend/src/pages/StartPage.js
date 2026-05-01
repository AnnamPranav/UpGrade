import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function StartPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    try {
      setLoading(true);

      const response = await API.post("/interview/start");

      navigate("/interview", {
        state: {
          sessionId: response.data.sessionId,
          question: response.data.question,
          questionNumber: response.data.questionNumber || 1,
          difficulty: response.data.difficulty || "medium",
        },
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      alert("Failed to generate question. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI Powered Mock Interview</h1>
      <p>Practice 5 interview questions with AI feedback.</p>

      {loading && <p className="loading-text">Generating question...</p>}

      <button onClick={handleStart} disabled={loading}>
        {loading ? "Generating question..." : "Start Interview"}
      </button>
    </div>
  );
}

export default StartPage;