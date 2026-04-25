import { useLocation, useNavigate } from "react-router-dom";

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const score = location.state?.score;
  const feedback = location.state?.feedback;
  const question = location.state?.question;
  const answer = location.state?.answer;

  return (
    <div className="container">
      <h2>Interview Result</h2>

      <p>
        <strong>Question:</strong> {question || "No question available"}
      </p>

      <p>
        <strong>Your Answer:</strong> {answer || "No answer submitted"}
      </p>

      <p>
        <strong>Score:</strong> {score ?? "N/A"}
      </p>

      <p>
        <strong>Feedback:</strong> {feedback || "No feedback available"}
      </p>

      <br />

      <button onClick={() => navigate("/")}>Go Back Home</button>
    </div>
  );
}

export default ResultPage;