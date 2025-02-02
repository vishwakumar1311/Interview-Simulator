import React from "react";

function Home({ onStartVideo }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh' 
    }}>
      <h1>Welcome to Interview Simulator</h1>
      <p>Click the button below to start your interview session</p>
      <button
        onClick={onStartVideo}
        style={{
          padding: '12px 24px',
          fontSize: '18px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Start Interview
      </button>
    </div>
  );
}

export default Home; 