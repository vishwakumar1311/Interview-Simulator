import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function VideoFeed({ onStopVideo }) {
  const [emotion, setEmotion] = useState("Analyzing...");
  const videoRef = useRef();

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
    const video = videoRef.current;
    video.onerror = handleCameraError;
  }, []);

  useEffect(() => {
    // Initial emotion analysis
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

    fetchEmotion(); // Run immediately on mount
    const interval = setInterval(fetchEmotion, 60000); // Run every 60 seconds (1 minute)
    
    return () => clearInterval(interval);
  }, []);

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
        onClick={onStopVideo}
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