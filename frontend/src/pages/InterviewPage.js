import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function InterviewPage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('Tell me about yourself.');
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState([]);

  const handleSubmit = async () => {
    // Store the answer
    const updatedAnswers = [...answers, { question, answer }];
    setAnswers(updatedAnswers);

    // Example: Fetch next question from AI backend
    // try {
    //   const response = await axios.post('/api/next-question', { answer });
    //   setQuestion(response.data.question);
    // } catch (error) {n
    //   console.error('Error fetching question:', error);
    // }

    // For now, navigate to results after one question
    navigate('/result', { state: { answers: updatedAnswers } });
  };

  return (
    <div className="container">
      <h2>Interview Question</h2>
      <div className="question-box">
        <p>{question}</p>
      </div>
      <textarea
        placeholder="Type your answer here..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={6}
      />
      <button onClick={handleSubmit} disabled={!answer.trim()}>
        Submit Answer
      </button>
    </div>
  );
}

export default InterviewPage;
