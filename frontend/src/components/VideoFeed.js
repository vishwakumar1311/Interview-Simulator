import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
  }, []);

  useEffect(() => {
    // Load questions from localStorage
    const savedQuestions = localStorage.getItem('interviewQuestions');
    if (savedQuestions) {
      setQuestions(JSON.parse(savedQuestions));
    }
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
    if (currentQuestionIndex < INTERVIEW_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      speakQuestion(INTERVIEW_QUESTIONS[currentQuestionIndex + 1]);
    }
  };

  // Function to start interview
  const handleStartInterview = async () => {
    try {
      await fetch('http://localhost:5000/start_recording', { method: 'POST' });
      setIsRecording(true);
      setIsQuestionVisible(true);
      // Speak the first question after a short delay
      setTimeout(() => {
        speakQuestion(INTERVIEW_QUESTIONS[0]);
      }, 1000);
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
        marginTop: '20px',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        backgroundColor: '#f9f9f9',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Interview Emotion Analysis Report</h2>
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '5px' }}>
          <h3 style={{ color: '#34495e' }}>Primary Emotion: {emotionSummary.dominant_emotion}</h3>
          <p>Total Duration: {(emotionSummary.total_frames * 3 / 60).toFixed(1)} minutes</p>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '5px' }}>
          <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Emotional Distribution:</h3>
          {Object.entries(emotionSummary.summary).map(([emotion, percentage]) => (
            <div key={emotion} style={{ 
              margin: '10px 0',
              padding: '10px',
              borderBottom: '1px solid #eee'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ textTransform: 'capitalize', color: '#2c3e50' }}>{emotion}</span>
                <span style={{ fontWeight: 'bold', color: '#2980b9' }}>{percentage.toFixed(1)}%</span>
              </div>
              <div style={{ 
                height: '6px',
                backgroundColor: '#ecf0f1',
                borderRadius: '3px',
                marginTop: '5px'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: '#3498db',
                  borderRadius: '3px'
                }} />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '30px',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#27ae60'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#2ecc71'}
        >
          Return to Home
        </button>
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
        minHeight: '80vh' 
      }}>
        <h2>Checking camera permissions...</h2>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '80vh' 
      }}>
        <h2>Camera Permission Required</h2>
        <p style={{ margin: '20px 0' }}>Please enable camera access in your browser to use the Interview Simulator.</p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button
            onClick={checkCameraPermission}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Check Again
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h1 style={{ marginBottom: '30px' }}>Interview Simulator</h1>
      {!showSummary ? (
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '800px'
        }}>
          <img
            src="http://127.0.0.1:5000/video_feed"
            alt="Candidate Face"
            style={{ 
              width: "600px", 
              borderRadius: "10px", 
              marginBottom: '30px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            ref={videoRef}
          />
          
          {isQuestionVisible && (
            <div style={{
              width: '100%',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>
                Question {currentQuestionIndex + 1} of {INTERVIEW_QUESTIONS.length}
              </h3>
              <p style={{ fontSize: '18px', color: '#34495e', marginBottom: '20px' }}>
                {INTERVIEW_QUESTIONS[currentQuestionIndex]}
              </p>
              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === INTERVIEW_QUESTIONS.length - 1}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  opacity: currentQuestionIndex === INTERVIEW_QUESTIONS.length - 1 ? 0.5 : 1
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
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
              Start Interview
            </button>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              <button
                onClick={handleStopInterview}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#d32f2f'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f44336'}
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
  );
}

export default VideoFeed; 