import React from "react";
import { useNavigate } from "react-router-dom";

function OnlineAssessment() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh' 
    }}>
      <h1>Online Assessment</h1>
      <p style={{ fontSize: '20px', margin: '20px 0' }}>Coming Soon!</p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Back to Home
      </button>
    </div>
  );
}

export default OnlineAssessment; 