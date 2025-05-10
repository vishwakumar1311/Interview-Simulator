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
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
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
  const [userResponse, setUserResponse] = useState("");
  const videoRef = useRef();
  const navigate = useNavigate();
  const speechSynthesis = window.speechSynthesis;
  const [questions, setQuestions] = useState([]);
  const [isIntroduction, setIsIntroduction] = useState(true);
  const [attemptedQuestions, setAttemptedQuestions] = useState(0);
  const [timer, setTimer] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [interviewState, setInterviewState] = useState('idle');
  const [interviewEvaluation, setInterviewEvaluation] = useState(null);
  const [isProcessingInterview, setIsProcessingInterview] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const userVideoRef = useRef();
  const [videoLoading, setVideoLoading] = useState(true);

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
    
    // Add onend handler to start recording when speech ends
    utterance.onend = async () => {
      setIsSpeaking(false);
      // Start recording with current question
      await startRecording(questionText);
    };
    
    speechSynthesis.speak(utterance);
  };

  // Add speech-to-text functions
  const startRecording = async (question) => {
    try {
      const response = await fetch('http://localhost:5000/start_listening', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question })
      });
      if (response.ok) {
        setIsRecording(true);
        console.log('Started recording user response...');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      const response = await fetch('http://localhost:5000/stop_listening', {
        method: 'POST'
      });
      const data = await response.json();
      setIsRecording(false);
      console.log('User response:', data.response);
      console.log('All interview responses:', data.interview_responses);
      return data.response;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return "";
    }
  };

  // Modify handleNextQuestion to include speech recording
  const handleNextQuestion = async () => {
    speechSynthesis.cancel();
    
    // Stop recording for current question if it was active
    if (isRecording) {
      const response = await stopRecording();
      console.log('User response for previous question:', response);
    }
    
    if (isIntroduction) {
      setIsIntroduction(false);
      setAttemptedQuestions(prev => prev + 1);
      
      // Start first actual question
      if (questions.length > 0 && questions[0]) {
        setTimeout(() => {
          speakQuestion(questions[0]);
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
          if (nextQuestion) {
            speakQuestion(nextQuestion);
          }
        }, 500);
        
        return nextIndex;
      });
    }
  };

  // Modify handleStartInterview
  const handleStartInterview = async () => {
    try {
      const response = await fetch('http://localhost:5000/start_recording', {
        method: 'POST'
      });
      
      if (response.ok) {
        setIsRecording(true);
        setInterviewStarted(true);
        setTimer(0);
        
        // Start introduction
        speakQuestion("Welcome to your interview. I'll be asking you a series of questions. Please answer them to the best of your ability.");
      }
    } catch (error) {
      console.error('Error starting interview:', error);
    }
  };

  // Modify handleStopInterview
  const handleStopInterview = async () => {
    const maxRetries = 3;
    let retryCount = 0;
    
    setIsProcessingInterview(true); // Start loading state
    
    const stopCamera = async () => {
      try {
        const response = await fetch('http://localhost:5000/stop_camera', {
          method: 'POST',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to stop camera');
        }
        
        return await response.json();
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retry attempt ${retryCount} of ${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await stopCamera();
        }
        throw error;
      }
    };
    
    try {
      // First stop the camera with retries
      console.log('Stopping camera...');
      const stopData = await stopCamera();
      console.log('Camera stopped:', stopData);
      
      // Get all interview responses
      console.log('Getting interview responses...');
      const responsesResponse = await fetch('http://localhost:5000/get_interview_responses');
      if (!responsesResponse.ok) {
        throw new Error('Failed to get interview responses');
      }
      
      const responsesData = await responsesResponse.json();
      console.log('Interview responses:', responsesData.responses);
      
      if (!responsesData.responses || responsesData.responses.length === 0) {
        throw new Error('No interview responses recorded');
      }
      
      // Send responses for evaluation
      console.log('Evaluating interview...');
      const evaluationResponse = await fetch('http://localhost:5000/evaluate_interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: responsesData.responses
        }),
      });
      
      if (!evaluationResponse.ok) {
        const errorData = await evaluationResponse.json();
        throw new Error(errorData.message || 'Failed to evaluate interview');
      }
      
      const evaluationData = await evaluationResponse.json();
      console.log('Interview score:', evaluationData.score);
      
      // Update state with score
      setEmotionSummary({
        score: evaluationData.score,
        emotion_summary: stopData.emotion_summary
      });
      
      // Clear interview responses
      await fetch('http://localhost:5000/clear_interview_responses', {
        method: 'POST',
      });
      
      // Reset interview state
      setInterviewState('idle');
      setCurrentQuestionIndex(0);
      setShowQuestions(false);
      setInterviewStarted(false);
      setShowSummary(true);
      
      // Stop the local webcam stream
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      
    } catch (error) {
      console.error('Error stopping interview:', error);
      
      const errorMessage = error.message === 'No interview responses recorded' 
        ? 'No responses were recorded during the interview. Please try again and ensure your answers are being recorded.'
        : `There was an error stopping the interview. ${error.message}\n\nPlease try again or refresh the page if the issue persists.`;
      
      alert(errorMessage);
      
      try {
        await fetch('http://localhost:5000/stop_camera', { method: 'POST' });
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    } finally {
      setIsProcessingInterview(false); // End loading state
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

  // Add event handlers to prevent copy/paste
  useEffect(() => {
    const preventCopyPaste = (e) => {
      e.preventDefault();
      return false;
    };

    // Prevent copy/paste events
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    
    // Prevent context menu
    document.addEventListener('contextmenu', preventCopyPaste);

    // Cleanup
    return () => {
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('contextmenu', preventCopyPaste);
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
              justifyContent: 'space-between',
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
              {isRecording && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: 'red',
                    borderRadius: '50%',
                    animation: 'pulse 1s infinite'
                  }} />
                  <span>Recording...</span>
                </div>
              )}
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
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {videoLoading && (
                    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(30,30,30,0.7)', zIndex: 2 }}>
                      <LoadingSpinner size="large" color="#4CAF50" />
                    </div>
                  )}
                  <img
                    src="http://127.0.0.1:5000/video_feed"
                    alt="Candidate Face"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: videoLoading ? 'none' : 'block'
                    }}
                    onLoad={() => setVideoLoading(false)}
                    onError={() => setVideoLoading(true)}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    zIndex: 3
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
                      ? "Welcome to your interview. I'll be asking you a series of questions. Please answer them to the best of your ability."
                      : (questions[currentQuestionIndex]?.question || questions[currentQuestionIndex] || "Loading...")}
                  </p>
                </div>

                {/* Control buttons */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginTop: 'auto'
                }}>
                  {!interviewStarted ? (
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
              
              {showSummary && emotionSummary && (
                <div className="interview-summary" style={{
                  padding: '20px',
                  backgroundColor: '#2d2d2d',
                  borderRadius: '10px',
                  margin: '20px'
                }}>
                  {/* Score Section */}
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '40px'
                  }}>
                    <h2 style={{ color: '#fff', marginBottom: '20px' }}>Interview Score</h2>
                    <div style={{
                      fontSize: '72px',
                      fontWeight: 'bold',
                      color: '#4CAF50',
                      margin: '20px 0'
                    }}>
                      {emotionSummary.score}/100
                    </div>
                    <div style={{
                      width: '200px',
                      height: '200px',
                      margin: '0 auto',
                      borderRadius: '50%',
                      backgroundColor: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '10px solid #4CAF50'
                    }}>
                      <span style={{
                        fontSize: '48px',
                        color: '#fff'
                      }}>
                        {emotionSummary.score}%
                      </span>
                    </div>
                  </div>

                  {/* Emotion Analysis Section */}
                  <div style={{
                    backgroundColor: '#333',
                    padding: '20px',
                    borderRadius: '10px',
                    marginTop: '20px'
                  }}>
                    <h3 style={{ color: '#fff', marginBottom: '20px' }}>Emotion Analysis</h3>
                    {emotionSummary.emotion_summary && emotionSummary.emotion_summary.summary && Object.keys(emotionSummary.emotion_summary.summary).length > 0 ? (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '15px'
                      }}>
                        {Object.entries(emotionSummary.emotion_summary.summary).map(([emotion, percentage]) => (
                          <div key={emotion} style={{
                            backgroundColor: '#2d2d2d',
                            padding: '15px',
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}>
                            <div style={{ color: '#fff', marginBottom: '5px', textTransform: 'capitalize' }}>
                              {emotion}
                            </div>
                            <div style={{
                              height: '8px',
                              backgroundColor: '#444',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                backgroundColor: '#4CAF50',
                                transition: 'width 1s ease-in-out'
                              }} />
                            </div>
                            <div style={{ color: '#4CAF50', marginTop: '5px' }}>
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#bbb', textAlign: 'center', marginTop: '10px' }}>
                        No emotion data available.
                      </div>
                    )}
                    {emotionSummary.emotion_summary && emotionSummary.emotion_summary.dominant_emotion && (
                      <div style={{
                        marginTop: '20px',
                        textAlign: 'center',
                        padding: '15px',
                        backgroundColor: '#2d2d2d',
                        borderRadius: '8px'
                      }}>
                        <span style={{ color: '#888' }}>Dominant Emotion: </span>
                        <span style={{ 
                          color: '#4CAF50',
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}>
                          {emotionSummary.emotion_summary.dominant_emotion}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
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
      {isProcessingInterview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #4CAF50',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <div style={{
            color: '#fff',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            Compiling Your Results
          </div>
          <div style={{
            color: '#4CAF50',
            fontSize: '16px'
          }}>
            Please wait while we analyze your interview...
          </div>
        </div>
      )}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
}
export default VideoFeed; 