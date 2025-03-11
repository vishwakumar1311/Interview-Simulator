import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from './LoadingSpinner';
import bgImage from './VideoFeed-BG.jpg';

const globalStyle = `
  body {
    margin: 0;
    padding: 0;
    font-family: 'Poppins', sans-serif;
    background-image: url(${bgImage});
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    background-repeat: no-repeat;
  }
`;

const INTERVIEW_QUESTIONS = [
  "Tell me about a time when you faced a challenging situation at work or school. How did you handle it?",
  "Describe a project you're particularly proud of. What was your role and what did you achieve?",
  "Give me an example of a time when you had to work with a difficult team member. How did you manage the situation?",
  "Tell me about a time when you had to meet a tight deadline. How did you ensure the task was completed on time?",
  "Describe a situation where you had to learn something new quickly. What approach did you take?",
  "Tell me about a time when you received negative feedback. How did you respond?",
  "Give me an example of a time when you showed leadership skills.",
  "Describe a situation where you had to resolve a conflict. What steps did you take?",
  "Tell me about a time when you had to adapt to a significant change. How did you handle it?",
  "Share an example of a time when you failed at something. What did you learn from it?"
];

function VideoFeed() {
  const [emotionSummary, setEmotionSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuestionVisible, setIsQuestionVisible] = useState(false);
  const videoRef = useRef();
  const navigate = useNavigate();
  const speechSynthesis = window.speechSynthesis;
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    checkCameraPermission();
    fetchQuestions();
  }, []);


  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err) {
      console.error("Camera permission error:", err);
      setHasPermission(false);
    }
  };


const fetchQuestions = async () => {
  try {
    // First try to get questions from localStorage
    const storedQuestions = localStorage.getItem('interviewQuestions');
    if (storedQuestions) {
      const data = JSON.parse(storedQuestions);
      const allQuestions = [...(data.technical || []), ...(data.behavioral || [])]
        .sort((a, b) => a.id - b.id);
      setQuestions(allQuestions);
      return;
    }

    // If no stored questions, get the setup data and make API call
    const setupData = JSON.parse(localStorage.getItem('interviewSetupData'));
    if (!setupData) {
      throw new Error("No interview setup data found");
    }

    const response = await fetch("http://localhost:5000/generate_questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(setupData)
    });

    if (!response.ok) {
      throw new Error("Failed to fetch questions");
    }

    const data = await response.json();
    console.log("API Response:", data);

    const allQuestions = [...(data.technical || []), ...(data.behavioral || [])]
      .sort((a, b) => a.id - b.id);

    setQuestions(allQuestions);
    localStorage.setItem("interviewQuestions", JSON.stringify(data));
  } catch (error) {
    console.error("Error fetching questions:", error);
    setQuestions([]);
  }
};




  const handleCameraError = async () => {
    try {
      const response = await fetch('http://localhost:5000/reset_camera', {
        method: 'POST'
      });
      if (!response.ok) {
        console.error('Failed to reset camera');
      }
    } catch (error) {
      console.error('Error resetting camera:', error);
    }
  };

  useEffect(() => {
    if (hasPermission) {
      const video = videoRef.current;
      video.onerror = handleCameraError;
    }
  }, [hasPermission]);

  // Function to speak the question
  const speakQuestion = (question) => {
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 0.9; // Slightly slower rate
    utterance.pitch = 1;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
  };

  // Function to handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => {
        const nextIndex = prev + 1;
        speakQuestion(questions[nextIndex].question); // Extract only the question text
        return nextIndex;
      });
    }
};


  // Function to start interview
  const handleStartInterview = async () => {
    try {
      await fetch('http://localhost:5000/start_recording', { method: 'POST' });
      setIsRecording(true);
      setIsQuestionVisible(true);
      // Speak the first question after a short delay
      if (questions.length > 0) {
        setTimeout(() => {
          speakQuestion(questions[0]);
        }, 1000);
      }      
    } catch (error) {
      console.error('Error starting interview:', error);
    }
  };

  const handleStopInterview = async () => {
    try {
      const response = await fetch('http://localhost:5000/stop_camera', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.emotion_summary) {
        setEmotionSummary(data.emotion_summary);
        setShowSummary(true);
      }
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping camera:', error);
      navigate('/');
    }
  };

  const renderEmotionSummary = () => {
    if (!emotionSummary || !emotionSummary.summary) return null;

    return (
      <div style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          marginBottom: '40px'
        }}>
          <h2>Interview Emotion Analysis Report</h2>
          <div>
            <h3>Primary Emotion: {emotionSummary.dominant_emotion}</h3>
            <p>Total Duration: {(emotionSummary.total_frames * 3 / 60).toFixed(1)} minutes</p>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Return to Home
          </button>
        </div>

        <div>
          <h3>Emotional Distribution</h3>
          <div>
            {Object.entries(emotionSummary.summary).map(([emotion, percentage]) => (
              <div key={emotion} style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px'
                }}>
                  <span style={{ textTransform: 'capitalize' }}>{emotion}</span>
                  <span>{percentage.toFixed(1)}%</span>
                </div>
                <div style={{ 
                  height: '20px',
                  backgroundColor: '#eee',
                  borderRadius: '4px'
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: '#4a90e2',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup when navigating away
      speechSynthesis.cancel();
      fetch('http://localhost:5000/stop_camera', {
        method: 'POST'
      }).catch(error => {
        console.error('Error stopping camera:', error);
      });
    };
  }, []);

  // Add handler for browser back button
  useEffect(() => {
    const handleBeforeUnload = () => {
      fetch('http://localhost:5000/stop_camera', {
        method: 'POST'
      }).catch(error => {
        console.error('Error stopping camera:', error);
      });
    };

    window.addEventListener('popstate', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('popstate', handleBeforeUnload);
    };
  }, []);

  if (hasPermission === null) {
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}>
        <LoadingSpinner size="large" color="#333" />  {/* ❓ Check if this renders a <div> inside a <p> */}
        <h2 style={{ 
          marginTop: '20px',
          color: '#333',
          fontFamily: "'Poppins', sans-serif"
        }}>Checking camera permissions...</h2>
      </div>
    );
  }
  

  if (hasPermission === false) {
    return (
      <div style={{ 
        textAlign: 'center',
        padding: '40px'
      }}>
        <h2>Camera Permission Required</h2>
        <p>Please enable camera access in your browser to use the Interview Simulator.</p>
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={checkCameraPermission}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Check Again
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{globalStyle}</style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          padding: "20px",
        }}
      >
        <h1 style={{ marginBottom: "30px" }}>Interview Simulator</h1>
  
        {!showSummary ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              maxWidth: "800px",
            }}
          >
            <div
              style={{
                borderRadius: "4px",
                overflow: "hidden",
                backgroundColor: "#000",
                marginBottom: "20px",
              }}
            >
              <img
                src="http://127.0.0.1:5000/video_feed"
                alt="Candidate Face"
                style={{
                  width: "600px",
                  borderRadius: "10px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
                ref={videoRef}
              />
            </div>
  
            {isQuestionVisible && (
              <div
                style={{
                  width: "100%",
                  padding: "20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <h3 style={{ marginBottom: "10px", color: "#2c3e50" }}>
                  Question {currentQuestionIndex + 1} of{" "}
                  {questions.length}
                </h3>
                <p
                  style={{
                    fontSize: "18px",
                    color: "#34495e",
                    marginBottom: "20px",
                  }}
                >
                  {questions[currentQuestionIndex]?.question || "Loading..."}
                </p>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    backgroundColor: "#3498db",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    opacity:
                      currentQuestionIndex === questions.length - 1 ? 0.5 : 1,
                  }}
                >
                  Next Question
                </button>
              </div>
            )}
  
            {!isRecording ? (
              <button
                onClick={handleStartInterview}
                style={{
                  padding: "12px 24px",
                  fontSize: "16px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#45a049")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#4CAF50")}
              >
                Start Interview
              </button>
            ) : (
              <div
                style={{
                  textAlign: "center",
                }}
              >
                <p style={{ marginBottom: "20px" }}>
                  Recording in progress... Your emotions are being analyzed.
                </p>
                <button
                  onClick={handleStopInterview}
                  style={{
                    padding: "12px 24px",
                    fontSize: "16px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    transition: "background-color 0.3s",
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#d32f2f")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#f44336")}
                >
                  End Interview
                </button>
              </div>
            )}
          </div>
        ) : (
          renderEmotionSummary()
        )}
      </div>
    </>
  );
}
export default VideoFeed; 