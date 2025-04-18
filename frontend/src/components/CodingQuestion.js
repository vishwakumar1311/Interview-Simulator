import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Select, MenuItem, Button, Paper } from '@mui/material';
import Editor from '@monaco-editor/react';
import axios from 'axios';

// Sample coding questions with test cases
const SAMPLE_QUESTIONS = [
  {
    id: 1,
    title: "Two Sum",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers in nums such that they add up to target.
You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.`,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
      }
    ],
    testCases: [
      {
        input: { nums: [2,7,11,15], target: 9 },
        expectedOutput: [0,1]
      },
      {
        input: { nums: [3,2,4], target: 6 },
        expectedOutput: [1,2]
      },
      {
        input: { nums: [3,3], target: 6 },
        expectedOutput: [0,1]
      }
    ],
    starterCode: {
      'python': `def two_sum(nums, target):
    # Write your code here
    pass`,
      'javascript': `function twoSum(nums, target) {
    // Write your code here
};`
    }
  }
];

function CodingQuestion() {
  const [questions] = useState(SAMPLE_QUESTIONS);
  const [currentQuestion, setCurrentQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [languages] = useState(['python', 'javascript']);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set initial code based on selected language
    setCode(currentQuestion.starterCode[selectedLanguage]);
  }, [selectedLanguage, currentQuestion]);

  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value);
  };

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const runCode = async () => {
    setLoading(true);
    setOutput(null);

    try {
      const response = await axios.post('http://localhost:5000/execute', {
        language: selectedLanguage,
        code: code,
        testCases: currentQuestion.testCases
      });

      setOutput({
        success: response.data.success,
        results: response.data.results,
        error: response.data.error
      });
    } catch (error) {
      setOutput({
        success: false,
        error: error.response?.data?.error || 'An error occurred while running the code'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Question Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {currentQuestion.title}
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
          {currentQuestion.description}
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          Examples:
        </Typography>
        {currentQuestion.examples.map((example, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Example {index + 1}:
            </Typography>
            <Typography variant="body1">
              Input: {example.input}
            </Typography>
            <Typography variant="body1">
              Output: {example.output}
            </Typography>
            {example.explanation && (
              <Typography variant="body1">
                Explanation: {example.explanation}
              </Typography>
            )}
          </Box>
        ))}
      </Paper>

      {/* Code Editor Section */}
      <Box sx={{ mb: 2 }}>
        <Select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          sx={{ mb: 2 }}
        >
          {languages.map((lang) => (
            <MenuItem key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </MenuItem>
          ))}
        </Select>

        <Editor
          height="400px"
          language={selectedLanguage}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            automaticLayout: true,
          }}
        />
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={runCode}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Running...' : 'Run Code'}
      </Button>

      {/* Output Section */}
      {output && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Results:
          </Typography>
          
          {output.error ? (
            <Typography color="error">
              {output.error}
            </Typography>
          ) : (
            <>
              <Typography variant="body1" sx={{ color: output.success ? 'success.main' : 'error.main', mb: 2 }}>
                {output.success ? 'All test cases passed!' : 'Some test cases failed.'}
              </Typography>
              
              {output.results && output.results.map((result, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    Test Case {index + 1}: {result.passed ? '✅ Passed' : '❌ Failed'}
                  </Typography>
                  {!result.passed && (
                    <>
                      <Typography variant="body2">
                        Expected: {JSON.stringify(result.expected)}
                      </Typography>
                      <Typography variant="body2">
                        Got: {JSON.stringify(result.actual)}
                      </Typography>
                    </>
                  )}
                </Box>
              ))}
            </>
          )}
        </Paper>
      )}
    </Container>
  );
}

export default CodingQuestion;