import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
              <p style={{ 
                color: '#666', 
                margin: '0',
                fontSize: '16px'
              }}>
                Recording in progress... Your emotions are being analyzed.
              </p>
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