import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function StartPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    try {
      setLoading(true);

      // Small delay to show loading text clearly
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const response = await API.post("/interview/start");

      navigate("/interview", {
        state: {
          question: response.data.question,
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
      <p>Practice your interview with AI-powered feedback.</p>

      {loading && <p className="loading-text">Generating question...</p>}

      <button onClick={handleStart} disabled={loading}>
        {loading ? "Generating question..." : "Start Interview"}
      </button>
    </div>
  );
}

export default StartPage;