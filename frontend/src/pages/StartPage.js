import { useNavigate } from "react-router-dom";

function StartPage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>AI Powered Mock Interview</h1>
      <button onClick={() => navigate("/interview")}>
        Start Interview
      </button>
    </div>
  );
}

export default StartPage;