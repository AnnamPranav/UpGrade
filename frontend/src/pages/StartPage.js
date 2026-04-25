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
          question: response.data.question,
        },
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      alert("Failed to start interview. Please check backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI Powered Mock Interview</h1>
      <p>Practice your interview with AI-powered feedback.</p>

      <button onClick={handleStart} disabled={loading}>
        {loading ? "Loading..." : "Start Interview"}
      </button>
    </div>
    
  );
}

export default StartPage;