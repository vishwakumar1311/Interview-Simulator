import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from './LoadingSpinner';
import bgImage from './VideoFeed-BG.jpg';
import interviewer from './interviewer.png';  // Adjust path as needed
import { logout } from '../utils/auth';

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const videoRef = useRef();
  const navigate = useNavigate();
  const speechSynthesis = window.speechSynthesis;
  const [questions, setQuestions] = useState([]);
  const [isIntroduction, setIsIntroduction] = useState(true);
  const [attemptedQuestions, setAttemptedQuestions] = useState(0);
  const [timer, setTimer] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkCameraPermission();
      await fetchQuestions();
    };
    init();
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
        console.log("Fetching questions...");
        
        const storedQuestions = localStorage.getItem('interviewQuestions');
        console.log("Stored questions:", storedQuestions);

        if (!storedQuestions) {
            throw new Error("No questions in localStorage");
        }

        const parsedQuestions = JSON.parse(storedQuestions);
        console.log("Parsed questions:", parsedQuestions);

        // Process questions into a flat array
        let finalQuestions = [];

        if (parsedQuestions.technical) {
            finalQuestions = [...finalQuestions, ...parsedQuestions.technical];
        }
        if (parsedQuestions.behavioral) {
            finalQuestions = [...finalQuestions, ...parsedQuestions.behavioral];
        }

        // If no questions found, use default questions
        if (finalQuestions.length === 0) {
            finalQuestions = [
                "Tell me about yourself and your experience.",
                "What are your key technical skills?",
                "Describe a challenging project you worked on.",
                "How do you handle difficult situations in a team?",
                "What are your career goals?",
                "How do you stay updated with industry trends?",
                "Describe your problem-solving approach.",
                "What interests you about this role?",
                "How do you handle pressure and deadlines?",
                "Do you have any questions for me?"
            ];
        }

        console.log("Final questions array:", finalQuestions);
        setQuestions(finalQuestions);

    } catch (error) {
        console.error("Error in fetchQuestions:", error);
        
        // Use default questions if anything fails
        const setupData = JSON.parse(localStorage.getItem('interviewSetupData')) || {
            role: "Software Developer",
            experience: "2"
        };

        setQuestions(INTERVIEW_QUESTIONS);
        localStorage.setItem('interviewQuestions', JSON.stringify({
            technical: INTERVIEW_QUESTIONS.slice(0, 5),
            behavioral: INTERVIEW_QUESTIONS.slice(5)
        }));
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
    speechSynthesis.cancel();
    
    const questionText = typeof question === 'object' ? question.question : question;
    
    if (!questionText) return;

    setIsSpeaking(true); // Start speaking animation
    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Add onend handler to stop animation when speech ends
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    speechSynthesis.speak(utterance);
  };

  // Function to handle next question
  const handleNextQuestion = () => {
    speechSynthesis.cancel();
    
    if (isIntroduction) {
      setIsIntroduction(false);
      setAttemptedQuestions(prev => prev + 1);
      
      // Start first actual question
      if (questions.length > 0 && questions[0]) {
        setTimeout(() => {
          speakQuestion(questions[0].question);
        }, 500);
      }
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => {
        const nextIndex = prev + 1;
        const nextQuestion = questions[nextIndex];
        
        setAttemptedQuestions(prev => prev + 1);
        
        setTimeout(() => {
          if (nextQuestion && nextQuestion.question) {
            speakQuestion(nextQuestion.question);
          }
        }, 500);
        
        return nextIndex;
      });
    }
  };

  const handleApiCall = async (url, options = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        return;
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // Token is invalid or expired
        logout();
        return;
      }

      return response;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Function to start interview
  const handleStartInterview = async () => {
    try {
      const response = await handleApiCall('http://localhost:5000/start_recording', {
        method: 'POST'
      });
      
      if (response && response.ok) {
        setIsRecording(true);
        setIsQuestionVisible(true);
        speakQuestion("Please introduce yourself in about 30 seconds...");
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
        setShowSummary(true);  // This will switch to the summary view
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error stopping camera:', error);
      navigate('/');
    }
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

  // Add timer effect
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Format timer function
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add useEffect to log when questions change
  useEffect(() => {
    console.log("Current questions in state:", questions);
  }, [questions]);

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
      <div style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#1a1a1a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {!showSummary ? (
          // Interview Interface
          <>
            {/* Header with timer */}
            <div style={{
              height: '60px',
              backgroundColor: '#2d2d2d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '0 20px'
            }}>
              <div style={{
                backgroundColor: '#333',
                padding: '5px 10px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '20px'
              }}>
                {formatTime(timer)}
              </div>
            </div>

            {/* Main content area */}
            <div style={{
              flex: 1,
              display: 'flex',
              padding: '20px',
              gap: '20px'
            }}>
              {/* Left side - Video feeds */}
              <div style={{
                flex: '1',
                display: 'flex',
                gap: '20px',
                height: 'calc(100vh - 160px)'
              }}>
                {/* Interviewer video */}
                <div style={{
                  flex: 1,
                  backgroundColor: '#2d2d2d',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: isSpeaking ? '3px solid #4CAF50' : 'none',
                  transition: 'border 0.3s ease-in-out',
                  boxShadow: isSpeaking ? '0 0 10px rgba(76, 175, 80, 0.5)' : 'none'
                }}>
                  <img
                    src={interviewer}
                    alt="Interviewer"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '5px 10px',
                    borderRadius: '4px'
                  }}>
                    Interviewer
                  </div>
                </div>

                {/* Candidate video */}
                <div style={{
                  flex: 1,
                  backgroundColor: '#2d2d2d',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <img
                    src="http://127.0.0.1:5000/video_feed"
                    alt="Candidate Face"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    ref={videoRef}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '5px 10px',
                    borderRadius: '4px'
                  }}>
                    You
                  </div>
                </div>
              </div>

              {/* Right side - Questions and controls */}
              <div style={{
                width: '300px',
                backgroundColor: '#2d2d2d',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Question display */}
                {isQuestionVisible && questions.length > 0 && (
                  <div style={{
                    flex: 1,
                    marginBottom: '20px'
                  }}>
                    <h3 style={{
                      color: '#fff',
                      marginBottom: '10px',
                      fontSize: '16px'
                    }}>
                      {isIntroduction ? "Introduction" : `Question ${currentQuestionIndex + 1}/${questions.length}`}
                    </h3>
                    <p style={{
                      color: '#ddd',
                      fontSize: '14px',
                      lineHeight: '1.4'
                    }}>
                      {isIntroduction 
                        ? "Please introduce yourself in about 30 seconds."
                        : (typeof questions[currentQuestionIndex] === 'string' 
                            ? questions[currentQuestionIndex] 
                            : questions[currentQuestionIndex]?.question || "Loading...")}
                    </p>
                  </div>
                )}

                {/* Control buttons */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginTop: 'auto'
                }}>
                  {!isRecording ? (
                    <button
                      onClick={handleStartInterview}
                      style={{
                        padding: '12px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      Start Interview
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleNextQuestion}
                        disabled={!isIntroduction && currentQuestionIndex === questions.length - 1}
                        style={{
                          padding: '12px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          opacity: (!isIntroduction && currentQuestionIndex === questions.length - 1) ? 0.5 : 1
                        }}
                      >
                        {isIntroduction ? "Start Questions" : "Next Question"}
                      </button>
                      <button
                        onClick={handleStopInterview}
                        style={{
                          padding: '12px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        End Interview
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          // Summary View
          <div style={{
            padding: '40px',
            height: '100%',
            overflow: 'auto'
          }}>
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              backgroundColor: '#2d2d2d',
              borderRadius: '15px',
              padding: '30px'
            }}>
              <h2 style={{
                color: '#fff',
                marginBottom: '30px',
                fontSize: '24px'
              }}>Interview Analysis Report</h2>
              
              {emotionSummary && (
                <>
                  <div style={{
                    marginBottom: '30px',
                    padding: '20px',
                    backgroundColor: '#333',
                    borderRadius: '10px'
                  }}>
                    <h3 style={{color: '#fff', marginBottom: '15px'}}>
                      Primary Emotion: {emotionSummary.dominant_emotion}
                    </h3>
                    <p style={{color: '#ddd'}}>
                      Total Duration: {(emotionSummary.total_frames * 3 / 60).toFixed(1)} minutes
                    </p>
                    <p style={{color: '#ddd'}}>
                      Questions Attempted: {attemptedQuestions} out of {questions.length + 1}
                    </p>
                  </div>

                  <div style={{marginTop: '30px'}}>
                    <h3 style={{color: '#fff', marginBottom: '20px'}}>Emotional Distribution</h3>
                    {Object.entries(emotionSummary.summary).map(([emotion, percentage]) => (
                      <div key={emotion} style={{marginBottom: '20px'}}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            color: '#ddd',
                            textTransform: 'capitalize'
                          }}>{emotion}</span>
                          <span style={{color: '#ddd'}}>{percentage.toFixed(1)}%</span>
                        </div>
                        <div style={{
                          height: '10px',
                          backgroundColor: '#444',
                          borderRadius: '5px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            backgroundColor: '#3498db',
                            borderRadius: '5px'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginTop: '30px'
                }}
              >
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
export default VideoFeed; 