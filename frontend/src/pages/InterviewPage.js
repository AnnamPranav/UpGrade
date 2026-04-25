import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get question from StartPage
  const question = location.state?.question || "No question received";

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Send answer to backend
      const response = await API.post("/interview/answer", {
        question,
        answer,
      });

      // Navigate to result page with response data
      navigate("/result", {
        state: {
          score: response.data.score,
          feedback: response.data.feedback,
          question,
          answer,
        },
      });

    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Failed to submit answer. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Interview Question</h2>

      {/* Question Display */}
      <div className="question-box">
        <p>{question}</p>
      </div>

      {/* Answer Input */}
      <textarea
        placeholder="Type your answer here..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={6}
        style={{ width: "100%", marginTop: "10px" }}
      />

      <br /><br />

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || loading}
      >
        {loading ? "Submitting..." : "Submit Answer"}
      </button>
    </div>
  );
}

export default InterviewPage;