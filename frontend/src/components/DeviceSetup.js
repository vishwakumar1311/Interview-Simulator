import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function DeviceSetup() {
  const navigate = useNavigate();
  const [cameraStatus, setCameraStatus] = useState('checking');
  const [micStatus, setMicStatus] = useState('checking');
  const [internetStatus, setInternetStatus] = useState('checking');
  const [videoStream, setVideoStream] = useState(null);
  const videoRef = React.useRef();

  useEffect(() => {
    checkDevices();
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkInternetConnection = async () => {
    try {
      // Try to fetch a small file from a reliable CDN
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      setInternetStatus('working');
    } catch (error) {
      console.error('Internet check failed:', error);
      setInternetStatus('failed');
    }
  };

  const checkDevices = async () => {
    try {
      // Check camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStatus('working');

      // Check microphone
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.getTracks().forEach(track => track.stop());
      setMicStatus('working');

      // Check internet connection
      await checkInternetConnection();
    } catch (error) {
      console.error('Error checking devices:', error);
      if (error.name === 'NotAllowedError') {
        setCameraStatus('failed');
        setMicStatus('failed');
      } else if (error.name === 'NotFoundError') {
        setCameraStatus('failed');
      }
    }
  };

  const handleStartInterview = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    navigate('/interview');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '40px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '600px',
        margin: 'auto'
      }}>
        <h1 style={{
          color: '#2c3e50',
          marginBottom: '30px',
          textAlign: 'center',
          fontSize: '28px',
          fontWeight: '600'
        }}>Device Setup</h1>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#34495e' }}>Please ensure your devices are properly set up:</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ marginRight: '10px', fontSize: '18px' }}>🎥 Camera:</span>
              <span style={{ 
                color: cameraStatus === 'working' ? '#4CAF50' : cameraStatus === 'failed' ? '#f44336' : '#FFA500',
                fontWeight: '500'
              }}>
                {cameraStatus === 'working' ? 'Working' : cameraStatus === 'failed' ? 'Not Working' : 'Checking...'}
              </span>
            </div>
            {cameraStatus === 'working' && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  borderRadius: '8px',
                  marginTop: '10px'
                }}
              />
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ marginRight: '10px', fontSize: '18px' }}>🎤 Microphone:</span>
              <span style={{ 
                color: micStatus === 'working' ? '#4CAF50' : micStatus === 'failed' ? '#f44336' : '#FFA500',
                fontWeight: '500'
              }}>
                {micStatus === 'working' ? 'Working' : micStatus === 'failed' ? 'Not Working' : 'Checking...'}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ marginRight: '10px', fontSize: '18px' }}>🌐 Internet Connection:</span>
              <span style={{ 
                color: internetStatus === 'working' ? '#4CAF50' : internetStatus === 'failed' ? '#f44336' : '#FFA500',
                fontWeight: '500'
              }}>
                {internetStatus === 'working' ? 'Working' : internetStatus === 'failed' ? 'Not Working' : 'Checking...'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleStartInterview}
            disabled={cameraStatus !== 'working' || micStatus !== 'working' || internetStatus !== 'working'}
            style={{
              backgroundColor: (cameraStatus === 'working' && micStatus === 'working' && internetStatus === 'working') 
                ? '#4CAF50' 
                : '#cccccc',
              color: 'white',
              padding: '12px 30px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (cameraStatus === 'working' && micStatus === 'working' && internetStatus === 'working') 
                ? 'pointer' 
                : 'not-allowed',
              transition: 'all 0.3s ease'
            }}
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeviceSetup; 