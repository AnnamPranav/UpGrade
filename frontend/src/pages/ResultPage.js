import { useLocation, useNavigate } from "react-router-dom";

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const finalScore = location.state?.finalScore;
  const scores = location.state?.scores || [];
  const feedbacks = location.state?.feedbacks || [];

  return (
    <div className="container">
      <h2>Final Interview Result</h2>

      <p>
        <strong>Final Score:</strong>{" "}
        {finalScore !== undefined ? finalScore.toFixed(2) : "N/A"}
      </p>

      <h3>Question-wise Scores</h3>
      {scores.length > 0 ? (
        scores.map((score, index) => (
          <p key={index}>
            <strong>Question {index + 1}:</strong> {score}/10
          </p>
        ))
      ) : (
        <p>No scores available</p>
      )}

      <h3>Feedbacks</h3>
      {feedbacks.length > 0 ? (
        feedbacks.map((feedback, index) => (
          <p key={index}>
            <strong>Question {index + 1}:</strong> {feedback}
          </p>
        ))
      ) : (
        <p>No feedback available</p>
      )}

      <br />

      <button onClick={() => navigate("/")}>Start Again</button>
    </div>
  );
}

export default ResultPage;