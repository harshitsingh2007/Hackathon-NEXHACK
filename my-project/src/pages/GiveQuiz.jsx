import React, { useEffect, useState } from "react";
import "./GiveQuiz.css";

const GiveQuiz = () => {
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [score, setScore] = useState(0);
  const [quizResults, setQuizResults] = useState(null);
  const [showChart, setShowChart] = useState(false);

  async function fetchData(topic = null, difficulty = null) {
    try {
      const token = localStorage.getItem("token");
      const requestBody = {
        num_questions: 10,
      };
      
      // Only include topic/difficulty if explicitly provided (otherwise adaptive)
      if (topic) requestBody.topic = topic;
      if (difficulty) requestBody.difficulty = difficulty;

      const response = await fetch("http://localhost:5000/api/interview/generate_quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.success && data.data?.quiz) {
        setQuizData(data.data.quiz);
      } else {
        console.error("Error in quiz response:", data);
        setQuizData([]);
      }
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setQuizData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    fetchData(); 
  }, []);

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0 && !quizCompleted) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && !quizCompleted) {
      handleQuizSubmit();
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, quizCompleted]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleOptionSelect = (questionIndex, optionIndex) => {
    setSelectedOptions((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) setCurrentQuestion((q) => q + 1);
  };

  const handlePrev = () => {
    if (currentQuestion > 0) setCurrentQuestion((q) => q - 1);
  };

  const handleQuizSubmit = async () => {
    let correct = 0, wrong = 0;
    const answers = [];
    
    quizData.forEach((q, i) => {
      const selectedIndex = selectedOptions[i];
      let isCorrect = false;
      if (selectedIndex !== undefined) {
        const selected = q.options[selectedIndex];
        isCorrect = selected.charAt(0).toLowerCase() === q.answer.toLowerCase();
        if (isCorrect) correct++;
        else wrong++;
      } else {
        wrong++;
      }
      
      answers.push({
        question: q.question,
        selectedOption: selectedIndex !== undefined ? q.options[selectedIndex] : null,
        correctOption: q.options.find(opt => opt.charAt(0).toLowerCase() === q.answer.toLowerCase()) || q.options[0],
        isCorrect: isCorrect
      });
    });

    const percentage = Math.round((correct / quizData.length) * 100);
    const topic = quizData[0]?.topic || "General";
    const difficulty = quizData[0]?.difficulty || "medium";

    setScore(correct);
    setQuizCompleted(true);
    setQuizResults({
      correctAnswers: correct,
      wrongAnswers: wrong,
      totalQuestions: quizData.length,
      percentage: percentage,
      timeTaken: 600 - timeLeft,
      topic: topic,
      difficulty: difficulty
    });

    // Save quiz results to database
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5000/api/quiz/save-result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: topic,
          difficulty: difficulty,
          totalQuestions: quizData.length,
          correctAnswers: correct,
          wrongAnswers: wrong,
          score: correct,
          percentage: percentage,
          timeTaken: 600 - timeLeft,
          answers: answers
        }),
      });
    } catch (error) {
      console.error("Error saving quiz results:", error);
    }
  };

  // Simple Chart Component
  const ResultsChart = ({ results }) => {
    if (!results) return null;

    const { correctAnswers, wrongAnswers, totalQuestions, percentage } = results;

    return (
      <div className="results-chart">
        <h3>Performance Analysis</h3>
        <div className="chart-container">
          {/* Pie Chart */}
          <div className="pie-chart-container">
            <div className="pie-chart">
              <div 
                className="chart-segment correct" 
                style={{ 
                  '--percentage': `${percentage}%`,
                  '--color': '#4CAF50'
                }}
              >
                <span className="segment-text correct-text">{percentage}%</span>
              </div>
              <div 
                className="chart-segment wrong" 
                style={{ 
                  '--percentage': `${100 - percentage}%`,
                  '--color': '#f44336'
                }}
              >
                <span className="segment-text wrong-text">{100 - percentage}%</span>
              </div>
            </div>
            <div className="pie-legend">
              <div className="legend-item">
                <div className="legend-color correct"></div>
                <span>Correct Answers</span>
              </div>
              <div className="legend-item">
                <div className="legend-color wrong"></div>
                <span>Wrong Answers</span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bar-chart">
            <h4>Answer Distribution</h4>
            <div className="bar-item">
              <div className="bar-label">Correct</div>
              <div className="bar-container">
                <div 
                  className="bar correct-bar" 
                  style={{ width: `${(correctAnswers / totalQuestions) * 100}%` }}
                >
                  <span className="bar-text">{correctAnswers}</span>
                </div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">Wrong</div>
              <div className="bar-container">
                <div 
                  className="bar wrong-bar" 
                  style={{ width: `${(wrongAnswers / totalQuestions) * 100}%` }}
                >
                  <span className="bar-text">{wrongAnswers}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{totalQuestions}</div>
              <div className="stat-label">Total Questions</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{percentage}%</div>
              <div className="stat-label">Accuracy</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatTime(results.timeTaken)}</div>
              <div className="stat-label">Time Taken</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{score}</div>
              <div className="stat-label">Score</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading" style={{ 
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#e2e8f0"
      }}>
        Generating personalized quiz based on your performance...
      </div>
    );
  }

  if (!quizData || quizData.length === 0) {
    return (
      <div className="quiz-start">
        <div className="quiz-card">
          <h1>⚠️ Quiz Generation Failed</h1>
          <p>Unable to generate quiz questions. Please try again.</p>
          <button className="btn retry-btn" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    const topicName = quizData[0]?.topic || "Adaptive";
    const difficulty = quizData[0]?.difficulty || "Adaptive";
    
    return (
      <div className="quiz-start">
        <div className="quiz-card">
          <h1>🎯 Adaptive Quiz</h1>
          <p>Topic: {topicName}</p>
          <p>Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</p>
          <p>Answer {quizData.length} unique questions in 10 minutes.</p>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginTop: "10px" }}>
            Questions are personalized based on your performance and ability level.
          </p>
          <button className="btn start-btn" onClick={() => setQuizStarted(true)}>
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="quiz-complete">
        <div className="quiz-card">
          <h2>Quiz Completed ✅</h2>
          <p className="score">Score: {score} / {quizData.length}</p>
          <p>Accuracy: {quizResults.percentage}%</p>
          <p>Time Taken: {formatTime(quizResults.timeTaken)}</p>
          
          {!showChart ? (
            <div className="result-actions">
              <button 
                className="btn chart-btn" 
                onClick={() => setShowChart(true)}
              >
                📊 View Detailed Analysis
              </button>
              <button className="btn retry-btn" onClick={() => window.location.reload()}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              <ResultsChart results={quizResults} />
              <div className="chart-actions">
                <button 
                  className="btn back-btn" 
                  onClick={() => setShowChart(false)}
                >
                  ← Back to Results
                </button>
                <button className="btn retry-btn" onClick={() => window.location.reload()}>
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const question = quizData[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.length) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h2>Question {currentQuestion + 1} / {quizData.length}</h2>
        <div className={`timer ${timeLeft < 60 ? "warning" : ""}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="question-section">
        <h3>{question?.question}</h3>
        <div className="options">
          {question?.options.map((option, idx) => (
            <label
              key={idx}
              className={`option ${selectedOptions[currentQuestion] === idx ? "selected" : ""}`}
              onClick={() => handleOptionSelect(currentQuestion, idx)}
            >
              {option}
            </label>
          ))}
        </div>
      </div>

      <div className="quiz-nav">
        <button className="btn" disabled={currentQuestion === 0} onClick={handlePrev}>
          Previous
        </button>
        {currentQuestion === quizData.length - 1 ? (
          <button className="btn submit" onClick={handleQuizSubmit}>
            Submit
          </button>
        ) : (
          <button className="btn" onClick={handleNext}>
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default GiveQuiz;