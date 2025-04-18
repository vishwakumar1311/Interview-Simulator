import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const Timer = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prevSeconds => prevSeconds + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: '8px 16px',
      borderRadius: '4px',
      display: 'inline-flex',
      alignItems: 'center'
    }}>
      <Typography variant="h6" sx={{ 
        fontFamily: 'monospace',
        color: '#fff',
        fontSize: '1.2rem',
        fontWeight: 'bold'
      }}>
        {formatTime(seconds)}
      </Typography>
    </Box>
  );
};

export default Timer; 