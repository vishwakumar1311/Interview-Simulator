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

function VideoFeed() {
  const [emotionSummary, setEmotionSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const videoRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    checkCameraPermission();
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

  const handleStartInterview = async () => {
    try {
      await fetch('http://localhost:5000/start_recording', { method: 'POST' });
      setIsRecording(true);
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
        <LoadingSpinner size="large" color="#333" />
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
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {!showSummary ? (
          <div style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              flex: '1',
              minWidth: '300px'
            }}>
              <h1 style={{ marginBottom: '20px' }}>Interview Simulator</h1>
              <div style={{
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#000'
              }}>
                <img
                  src="http://127.0.0.1:5000/video_feed"
                  alt="Candidate Face"
                  style={{ 
                    width: "100%",
                    display: "block"
                  }}
                  ref={videoRef}
                />
              </div>
            </div>

            <div style={{
              flex: '1',
              minWidth: '300px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {!isRecording ? (
                <button
                  onClick={handleStartInterview}
                  style={{
                    padding: '15px 30px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Start Interview
                </button>
              ) : (
                <div style={{
                  textAlign: 'center'
                }}>
                  <p style={{ marginBottom: '20px' }}>
                    <LoadingSpinner size="small" color="#333" />
                    Recording in progress... Your emotions are being analyzed.
                  </p>
                  <button
                    onClick={handleStopInterview}
                    style={{
                      padding: '15px 30px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    End Interview
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          renderEmotionSummary()
        )}
      </div>
    </>
  );
}

export default VideoFeed; 