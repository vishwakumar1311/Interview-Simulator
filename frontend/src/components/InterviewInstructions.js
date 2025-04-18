import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import backgroundImage from './InterviewSetup-BG.jpg';

function InterviewInstructions() {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate('/interview');
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      padding: '20px'
    }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ 
          p: 5, 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px'
        }}>
          <Typography variant="h4" gutterBottom align="center" sx={{ 
            mb: 4,
            color: '#2c3e50',
            fontWeight: 600
          }}>
            Interview Setup Instructions
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{
              color: '#34495e',
              fontWeight: 500,
              mb: 2
            }}>
              Before you begin, please ensure:
            </Typography>
            <Box component="ul" sx={{
              fontSize: '1.1rem',
              lineHeight: 2,
              color: '#4a5568',
              pl: 3,
              '& li': {
                mb: 1.5
              }
            }}>
              <li>You are in a well-lit environment with proper lighting</li>
              <li>Your microphone is properly connected and positioned close to your mouth</li>
              <li>You are in a quiet environment with minimal background noise</li>
              <li>Your camera is properly positioned to show your face clearly</li>
              <li>You have a stable internet connection</li>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleNext}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                textTransform: 'none',
                borderRadius: 2,
                minWidth: '200px'
              }}
            >
              I'm Ready to Start
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default InterviewInstructions; 