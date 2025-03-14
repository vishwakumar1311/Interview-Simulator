import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from './LoadingSpinner';
import bgImage from './ResumeMatcher-BG.jpg';

// Add global style to ensure the background covers everything
const globalStyle = `
  body {
    margin: 0;
    padding: 0;
    background-image: url(${bgImage});
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    background-repeat: no-repeat;
    min-height: 100vh;
    font-family: 'Poppins', sans-serif;
  }
`;

function AIResumeMatcher() {
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const TOGETHER_API_KEY = '06150d84db100f3ea0d4793266abeed1834b2b0ff3c1af53d650afab023bdef5'; // Replace with your API key

  const extractTextFromPDF = async (file) => {
    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('http://localhost:5000/extract-text', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to extract text from PDF');
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const analyzeResume = async (resumeText, jobDescription) => {
    try {
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
          messages: [
            {
              role: "system",
              content: "You are an AI Resume Matcher. Compare the resume text and job description. - Calculate an ATS score as a percentage (e.g., 72%). - Provide **three-point feedback** summarizing top three key improvements.- Output Score : 'XX%',Feedback: 'Short feedback with three improvements.'} - Keep it under **100 words**."
            },
            {
              role: "user",
              content: `Resume:${resumeText} \n\n Job Description:${jobDescription}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      // Parse the response to extract score and feedback
      const responseText = data.choices[0].message.content;
      const scoreMatch = responseText.match(/Score\s*:\s*['"]?(\d+)%/i);
      const feedbackMatch = responseText.match(/Feedback\s*:\s*['"]?(.*?)['"]?(\}|\s*$)/i);

      return {
        score: scoreMatch ? scoreMatch[1] : "N/A",
        feedback: feedbackMatch ? feedbackMatch[1].trim() : "No feedback available"
      };
    } catch (error) {
      console.error('Error analyzing resume:', error);
      throw new Error('Failed to analyze resume');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume || !jobDescription.trim()) {
      alert('Please upload a resume and enter the job description');
      return;
    }

    setIsAnalyzing(true);
    try {
      const resumeText = await extractTextFromPDF(resume);
      const analysis = await analyzeResume(resumeText, jobDescription);
      setAnalysisResults(analysis);
    } catch (error) {
      alert('Error analyzing resume: ' + error.message);
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ 
        maxWidth: '800px', 
        marginLeft: 'auto',
        marginRight: '40px',
        padding: '20px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <h1 style={{ 
          marginBottom: '30px', 
          textAlign: 'left',
          color: '#333',
          fontSize: '2.5rem'
        }}>Resume Matcher</h1>
        
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="resume" style={{ 
                display: 'block', 
                marginBottom: '10px', 
                color: '#333',
                fontSize: '1.1rem',
                fontWeight: '500'
              }}>
                Upload Resume (PDF)
              </label>
              <input
                type="file"
                id="resume"
                accept=".pdf"
                onChange={(e) => setResume(e.target.files[0])}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="jobDescription" style={{ 
                display: 'block', 
                marginBottom: '10px', 
                color: '#333',
                fontSize: '1.1rem',
                fontWeight: '500'
              }}>
                Job Description
              </label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '150px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem'
                }}
                placeholder="Paste the job description here..."
              />
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                opacity: isAnalyzing ? 0.7 : 1,
                fontSize: '1.1rem',
                fontWeight: '500'
              }}
            >
              {isAnalyzing ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <LoadingSpinner size="small" color="white" />
                  Analyzing Resume...
                </div>
              ) : (
                'Analyze Resume'
              )}
            </button>
          </form>

          {analysisResults && (
            <div style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ 
                marginBottom: '15px',
                fontSize: '1.3rem',
                color: '#333'
              }}>Analysis Results</h3>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  border: '3px solid',
                  borderColor: parseInt(analysisResults.score) >= 70 ? '#4CAF50' : '#f44336',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  marginRight: '20px',
                  backgroundColor: 'white'
                }}>
                  {analysisResults.score}%
                </div>
                <div>
                  <h4 style={{ 
                    marginBottom: '5px',
                    fontSize: '1.2rem',
                    color: '#333'
                  }}>ATS Score</h4>
                  <p style={{ color: '#666' }}>Match percentage with job requirements</p>
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                padding: '20px',
                borderRadius: '8px'
              }}>
                <h4 style={{ 
                  marginBottom: '10px',
                  fontSize: '1.1rem',
                  color: '#333'
                }}>Improvement Suggestions</h4>
                <p style={{ 
                  whiteSpace: 'pre-line',
                  color: '#444',
                  lineHeight: '1.5'
                }}>{analysisResults.feedback}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AIResumeMatcher; 