import React from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from './LoadingSpinner';

function OnlineAssessment() {
  const navigate = useNavigate();
  const assessmentType = localStorage.getItem('assessmentType');

  if (assessmentType === 'aptitude') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '80vh' 
      }}>
        <h1>Aptitude Test</h1>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '20px', 
          margin: '30px 0' 
        }}>
          <LoadingSpinner size="large" color="#3D3D3D" />
          <p style={{ fontSize: '20px' }}>Redirecting to Aptitude Test...</p>
        </div>
        <button
          onClick={() => navigate('/aptitude')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#F57C00'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#FF9800'}
        >
          Go to Aptitude Test
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh' 
    }}>
      <h1>Online Assessment</h1>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '20px', 
        margin: '30px 0' 
      }}>
        <LoadingSpinner size="large" color="#3D3D3D" />
        <p style={{ fontSize: '20px' }}>Coming Soon!</p>
      </div>
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
          transition: 'background-color 0.3s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#F57C00'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#FF9800'}
      >
        Back to Home
      </button>
    </div>
  );
}

export default OnlineAssessment; 