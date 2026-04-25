import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const question = location.state?.question || "No question received";

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Small delay to show loading text clearly
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const response = await API.post("/interview/answer", {
        question,
        answer,
      });

      navigate("/result", {
        state: {
          score: response.data.score,
          feedback: response.data.feedback,
          question,
          answer,
        },
      });
    } catch (error) {
      console.error("Error evaluating answer:", error);
      alert("Failed to evaluate answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Interview Question</h2>

      <div className="question-box">
        <p>{question}</p>
      </div>

      {loading && <p className="loading-text">Evaluating answer...</p>}

      <textarea
        placeholder="Type your answer here..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={6}
        disabled={loading}
      />

      <br />
      <br />

      <button onClick={handleSubmit} disabled={!answer.trim() || loading}>
        {loading ? "Evaluating answer..." : "Submit Answer"}
      </button>
    </div>
  );
}

export default InterviewPage;