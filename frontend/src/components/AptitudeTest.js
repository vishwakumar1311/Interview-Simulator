import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import './AptitudeTest.css';

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const QuestionResult = styled(Paper)(({ theme, correct }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderLeft: `4px solid ${correct ? theme.palette.success.main : theme.palette.error.main}`,
  backgroundColor: correct ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)',
}));

const ActionButton = styled(Button)(({ theme }) => ({
  minWidth: '180px',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    marginBottom: theme.spacing(1),
  },
}));

const AptitudeTest = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds
  const [testStarted, setTestStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  const calculateScore = useCallback(() => {
    setEndTime(Date.now());
    let correctAnswers = 0;
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correct_answer) {
        correctAnswers++;
      }
    });
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    setScore(finalScore);
    setTestStarted(false);
  }, [questions, selectedAnswers]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    let timer;
    if (testStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      calculateScore();
    }
    return () => clearInterval(timer);
  }, [testStarted, timeLeft, calculateScore]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeTaken = (start, end) => {
    const totalSeconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} minutes ${seconds} seconds`;
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://localhost:5000/generate_aptitude_questions');
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.questions);
      } else {
        setError('Failed to load questions');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setScore(null);
    setTimeLeft(20 * 60);
    setTestStarted(false);
    setStartTime(null);
    setEndTime(null);
  };

  const startTest = () => {
    setTestStarted(true);
    setStartTime(Date.now());
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <StyledContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </StyledContainer>
    );
  }

  if (error) {
    return (
      <StyledContainer>
        <Alert severity="error">{error}</Alert>
      </StyledContainer>
    );
  }

  if (!testStarted && !score) {
    return (
      <StyledContainer maxWidth="md">
        <StyledPaper elevation={3}>
          <Typography variant="h4" component="h2" gutterBottom align="center">
            Aptitude Test
          </Typography>
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Test Information:
            </Typography>
            <Typography variant="body1" paragraph>
              Total Questions: 20
            </Typography>
            <Typography variant="body1" paragraph>
              Time Limit: 20 minutes
            </Typography>
            <Typography variant="h6" gutterBottom>
              Instructions:
            </Typography>
            <ul>
              <li>You have 20 minutes to complete the test</li>
              <li>Each question has 4 options</li>
              <li>You can navigate between questions</li>
              <li>Your score will be calculated based on correct answers</li>
            </ul>
          </Box>
          <Box display="flex" justifyContent="center" mt={3}>
            <ActionButton
              variant="contained"
              color="primary"
              onClick={startTest}
              size="large"
            >
              Start Test
            </ActionButton>
          </Box>
        </StyledPaper>
      </StyledContainer>
    );
  }

  if (score !== null && !showDetailedResults) {
    return (
      <StyledContainer maxWidth="md">
        <StyledPaper elevation={3}>
          <Typography variant="h4" component="h2" gutterBottom align="center">
            Test Complete!
          </Typography>
          <Box mt={3} textAlign="center">
            <Typography variant="h5" gutterBottom>
              Your Score: {score}/100
            </Typography>
            <Typography variant="h6" gutterBottom>
              Time Taken: {formatTimeTaken(startTime, endTime)}
            </Typography>
          </Box>
          <Grid container spacing={2} justifyContent="center" mt={3}>
            <Grid item xs={12} sm={6}>
              <ActionButton
                variant="contained"
                color="primary"
                onClick={() => setShowDetailedResults(true)}
                fullWidth
              >
                View Detailed Answers
              </ActionButton>
            </Grid>
            <Grid item xs={12} sm={6}>
              <ActionButton
                variant="contained"
                color="secondary"
                onClick={handleGoToHome}
                fullWidth
              >
                Go to Home
              </ActionButton>
            </Grid>
          </Grid>
        </StyledPaper>
      </StyledContainer>
    );
  }

  if (showDetailedResults) {
    return (
      <StyledContainer maxWidth="md">
        <StyledPaper elevation={3}>
          <Typography variant="h4" component="h2" gutterBottom align="center">
            Detailed Results
          </Typography>
          <Box mt={3} textAlign="center">
            <Typography variant="h5" gutterBottom>
              Your Score: {score}/100
            </Typography>
            <Typography variant="h6" gutterBottom>
              Time Taken: {formatTimeTaken(startTime, endTime)}
            </Typography>
          </Box>
          <Box mt={3}>
            {questions.map((question, index) => {
              const userAnswer = selectedAnswers[question.id] !== undefined 
                ? question.options[selectedAnswers[question.id]] 
                : "Not answered";
              const isCorrect = selectedAnswers[question.id] === question.correct_answer;
              
              return (
                <QuestionResult key={question.id} correct={isCorrect} elevation={1}>
                  <Typography variant="h6" gutterBottom>
                    Question {index + 1}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {question.question}
                  </Typography>
                  <Box bgcolor="background.default" p={2} borderRadius={1}>
                    <Typography variant="body1" paragraph>
                      Your Answer: {userAnswer}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      Correct Answer: {question.correct_answer_text}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={isCorrect ? "success.main" : "error.main"}
                      fontWeight="bold"
                    >
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </Typography>
                  </Box>
                </QuestionResult>
              );
            })}
          </Box>
          <Grid container spacing={2} justifyContent="center" mt={3}>
            <Grid item xs={12} sm={6}>
              <ActionButton
                variant="contained"
                color="primary"
                onClick={() => setShowDetailedResults(false)}
                fullWidth
              >
                Back to Summary
              </ActionButton>
            </Grid>
            <Grid item xs={12} sm={6}>
              <ActionButton
                variant="contained"
                color="secondary"
                onClick={handleGoToHome}
                fullWidth
              >
                Go to Home
              </ActionButton>
            </Grid>
          </Grid>
        </StyledPaper>
      </StyledContainer>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <StyledContainer maxWidth="md">
      <StyledPaper elevation={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Time Remaining: {formatTime(timeLeft)}
          </Typography>
          <Typography variant="h6">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="center" gap={1} mb={3}>
          {questions.map((_, index) => (
            <Box
              key={index}
              width={12}
              height={12}
              borderRadius="50%"
              bgcolor={
                index === currentQuestionIndex
                  ? 'primary.main'
                  : selectedAnswers[questions[index].id] !== undefined
                  ? 'secondary.main'
                  : 'grey.300'
              }
            />
          ))}
        </Box>

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            {currentQuestion.question}
          </Typography>
          <Grid container spacing={2}>
            {currentQuestion.options.map((option, index) => (
              <Grid item xs={12} key={index}>
                <Button
                  fullWidth
                  variant={selectedAnswers[currentQuestion.id] === index ? "contained" : "outlined"}
                  color={selectedAnswers[currentQuestion.id] === index ? "primary" : "default"}
                  onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  {option}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Button
            variant="contained"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={calculateScore}
              disabled={Object.keys(selectedAnswers).length !== questions.length}
            >
              Submit
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </StyledPaper>
    </StyledContainer>
  );
};

export default AptitudeTest; 