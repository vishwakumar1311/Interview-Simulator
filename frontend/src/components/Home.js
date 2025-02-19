import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh' 
    }}>
      <h1>Welcome to Interview Simulator</h1>
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
          onClick={() => navigate('/interview')}
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

      <p style={{ 
        marginTop: '30px', 
        color: '#666',
        fontSize: '14px' 
      }}>
        Note: AI Resume Matcher and Online Assessment features are coming soon!
      </p>
    </div>
  );
}

export default Home; 