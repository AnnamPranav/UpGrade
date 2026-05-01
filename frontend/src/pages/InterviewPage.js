import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [sessionId] = useState(location.state?.sessionId);
  const [question, setQuestion] = useState(
    location.state?.question || "No question received"
  );
  const [questionNumber, setQuestionNumber] = useState(
    location.state?.questionNumber || 1
  );
  const [difficulty, setDifficulty] = useState(
    location.state?.difficulty || "medium"
  );

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const totalQuestions = 5;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await API.post("/interview/answer", {
        sessionId,
        answer,
        questionNumber: questionNumber,
      });

      if (response.data.completed === true) {
        navigate("/result", {
          state: {
            finalScore: response.data.finalScore,
            scores: response.data.scores,
            feedbacks: response.data.feedbacks,
          },
        });
      } else {
        setQuestion(response.data.nextQuestion);
        setQuestionNumber(response.data.nextQuestionNumber);
        setDifficulty(response.data.nextDifficulty || "medium");
        setAnswer("");
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Failed to submit answer. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Interview Question</h2>

      <p className="progress-text">
        Question {questionNumber} / {totalQuestions}
      </p>

      <p>
        <strong>Difficulty:</strong> {difficulty}
      </p>

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