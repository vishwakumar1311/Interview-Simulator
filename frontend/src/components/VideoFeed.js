import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function VideoFeed() {
  const [emotion, setEmotion] = useState("Analyzing...");
  const [hasPermission, setHasPermission] = useState(null);
  const videoRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    // Check camera permissions when component mounts
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream after permission check
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

  useEffect(() => {
    if (hasPermission) {
      const fetchEmotion = async () => {
        try {
          const response = await axios.get("http://127.0.0.1:5000/analyze_emotion");
          if (response.data.emotion) {
            setEmotion(response.data.emotion);
          } else {
            setEmotion(response.data.status);
          }
        } catch (error) {
          setEmotion("Error detecting face");
        }
      };

      fetchEmotion(); // Initial fetch
      const interval = setInterval(fetchEmotion, 3000); // Update every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [hasPermission]);

  const handleStopInterview = async () => {
    try {
      await fetch('http://localhost:5000/stop_camera', {
        method: 'POST'
      });
      navigate('/');
    } catch (error) {
      console.error('Error stopping camera:', error);
      navigate('/');
    }
  };

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
    <div>
      <h1>Interview Simulator</h1>
      <img
        src="http://127.0.0.1:5000/video_feed"
        alt="Candidate Face"
        style={{ width: "600px", borderRadius: "10px" }}
        ref={videoRef}
      />
      <h2>Current Emotion: {emotion}</h2>
      <button
        onClick={handleStopInterview}
        style={{
          padding: '8px 16px',
          fontSize: '16px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Stop Interview
      </button>
    </div>
  );
}

export default VideoFeed; 