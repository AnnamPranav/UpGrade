import { useLocation, useNavigate } from "react-router-dom";

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get data from InterviewPage
  const score = location.state?.score;
  const feedback = location.state?.feedback;
  const question = location.state?.question;
  const answer = location.state?.answer;

  return (
    <div className="container">
      <h2>Interview Result</h2>

      {/* Show Question */}
      <p><strong>Question:</strong> {question}</p>

      {/* Show User Answer */}
      <p><strong>Your Answer:</strong> {answer}</p>

      {/* Show Score */}
      <p><strong>Score:</strong> {score}</p>

      {/* Show Feedback */}
      <p><strong>Feedback:</strong> {feedback}</p>

      <br />

      {/* Go back button */}
      <button onClick={() => navigate("/")}>
        Go Back to Home
      </button>
    </div>
  );
}

export default ResultPage;