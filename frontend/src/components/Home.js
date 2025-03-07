import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Stop camera when arriving at home page
    fetch('http://localhost:5000/stop_camera', {
      method: 'POST'
    }).catch(error => {
      console.error('Error stopping camera:', error);
    });
  }, []);

  const handleInterviewClick = async () => {
    try {
      // First stop any existing camera/recording
      await fetch('http://localhost:5000/stop_camera', {
        method: 'POST'
      });
      
      // Navigate and force reload
      navigate('/setup');
      window.location.reload();
    } catch (error) {
      console.error('Error resetting camera:', error);
      // Navigate and force reload even on error
      navigate('/setup');
      window.location.reload();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh' 
    }}>
      <h1>Interview Kit</h1>
      <p>Choose an option to begin your interview preparation</p>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginTop: '30px'
      }}>
        <button
          onClick={() => navigate('/resume-matcher')}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            width: '250px'
          }}
        >
          AI Resume Matcher
        </button>

        <button
          onClick={handleInterviewClick}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            width: '250px'
          }}
        >
          Interview Simulator
        </button>

        <button
          onClick={() => navigate('/assessment')}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            width: '250px'
          }}
        >
          Online Assessment
        </button>
      </div>
    </div>
  );
}

export default Home; 