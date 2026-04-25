import { useLocation, useNavigate } from 'react-router-dom';

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const answers = location.state?.answers || [];

  return (
    <div className="container">
      <h2>Interview Complete!</h2>
      <div className="results">
        {answers.map((item, index) => (
          <div key={index} className="result-item">
            <h4>Q: {item.question}</h4>
            <p>A: {item.answer}</p>
          </div>
        ))}
      </div>
      <button onClick={() => navigate('/')}>
        Start New Interview
      </button>
    </div>
  );
}

export default ResultPage;
