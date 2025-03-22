import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from './LoadingSpinner';
import bgImage from './ResumeMatcher-BG.jpg';

// Add global style to ensure the background covers everything
const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
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
  const [showResults, setShowResults] = useState(false);

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
              content: `You are an AI Career Coach providing direct feedback to a job candidate. 
              Analyze their resume against the job description and provide personalized feedback in exactly this format:

Score: XX%

Your Matching Skills:
• "Start with 'You have demonstrated...' or 'Your experience in...' to highlight their strengths"
• "List 2-3 key skills that align well with the job"
• "Be specific about their relevant achievements"

Areas for Growth:
• "Start with 'Consider adding...' or 'You could strengthen...' to suggest improvements"
• "Provide specific, actionable suggestions"
• "Focus on skills mentioned in the job description"

Recommended Next Steps:
• "Give clear, actionable steps they can take immediately"
• "Suggest specific certifications or skills to acquire"
• "Provide tips for highlighting certain experiences"

Keep the tone encouraging and constructive, addressing the candidate directly with "you" and "your".`
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
      const responseText = data.choices[0].message.content;
      
      // Extract score
      const scoreMatch = responseText.match(/Score:\s*(\d+)%/);
      const score = scoreMatch ? scoreMatch[1] : "N/A";

      // Split the response into sections
      const sections = responseText.split('\n\n').filter(Boolean);
      
      // Remove the score section and join the rest as feedback
      const feedback = sections.slice(1).join('\n\n');

      return {
        score: score,
        feedback: feedback || "No feedback available"
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
      setShowResults(true);
    } catch (error) {
      alert('Error analyzing resume: ' + error.message);
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInterviewClick = () => {
    navigate('/interview');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleAssessmentClick = () => {
    navigate('/assessment');
  };

  const ResultsPage = () => (
    <div style={{ 
      maxWidth: '800px', 
      marginLeft: 'auto',
      marginRight: '40px',
      padding: '20px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h1 style={{ 
        marginBottom: '35px',
        textAlign: 'left',
        color: '#1a1a1a',
        fontSize: '2.5rem',
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: '600',
        letterSpacing: '-0.5px',
        position: 'relative',
        paddingBottom: '15px'
      }}>Analysis Results
        <div style={{
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '4px',
          backgroundColor: '#4CAF50',
          borderRadius: '2px'
        }}/>
      </h1>

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(10px)',
        padding: '35px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        marginBottom: '30px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '4px solid',
            borderColor: parseInt(analysisResults.score) >= 70 ? '#4CAF50' : '#f44336',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            marginRight: '25px',
            backgroundColor: 'white',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            {analysisResults.score}%
          </div>
          <div>
            <h4 style={{ 
              marginBottom: '5px',
              fontSize: '1.4rem',
              color: '#1a1a1a',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: '600'
            }}>ATS Score</h4>
            <p style={{ 
              color: '#666',
              fontSize: '1.1rem'
            }}>Match percentage with job requirements</p>
          </div>
        </div>

        {analysisResults.feedback.split('\n\n').map((section, index) => {
          if (!section.trim()) return null;
          
          const [title, ...points] = section.split('\n');
          return (
            <div key={index} style={{ 
              marginBottom: '30px',
              backgroundColor: 'rgba(250, 250, 250, 0.95)',
              padding: '25px',
              borderRadius: '10px',
              border: '1px solid rgba(0, 0, 0, 0.06)'
            }}>
              <h5 style={{ 
                color: '#2c3e50',
                marginBottom: '20px',
                fontSize: '1.15rem',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: '600',
                letterSpacing: '0.2px',
                borderBottom: '2px solid rgba(74, 175, 80, 0.3)',
                paddingBottom: '12px'
              }}>{title}</h5>
              <ul style={{ 
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {points.filter(point => point.trim()).map((point, i) => (
                  <li key={i} style={{
                    marginBottom: '12px',
                    paddingLeft: '24px',
                    position: 'relative',
                    lineHeight: '1.6',
                    color: '#333',
                    fontSize: '0.95rem'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '0',
                      color: '#4CAF50',
                      fontWeight: '600'
                    }}>•</span>
                    {point.replace('•', '').trim()}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        marginTop: '20px',
        marginBottom: '40px',
        paddingBottom: '20px'
      }}>
        <button
          onClick={handleHomeClick}
          style={{
            padding: '14px 28px',
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            fontFamily: "'Montserrat', sans-serif",
            transition: 'background-color 0.3s',
            flex: '1',
            maxWidth: '200px'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#444'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#333'}
        >
          Back to Home
        </button>

        <button
          onClick={handleInterviewClick}
          style={{
            padding: '14px 28px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            fontFamily: "'Montserrat', sans-serif",
            transition: 'background-color 0.3s',
            flex: '1',
            maxWidth: '200px'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
        >
          Interview Simulator
        </button>

        <button
          onClick={handleAssessmentClick}
          style={{
            padding: '14px 28px',
            backgroundColor: '#027c68',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            fontFamily: "'Montserrat', sans-serif",
            transition: 'background-color 0.3s',
            flex: '1',
            maxWidth: '200px'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#026355'}
          onMouseOver={(e) => e.target.style.backgroundColor = '#d9d9d9'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#e6e6e6'}
        >
          Online Assessment
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{globalStyle}</style>
      {!showResults ? (
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
            marginBottom: '35px',
            textAlign: 'left',
            color: '#1a1a1a',
            fontSize: '2.5rem',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: '600',
            letterSpacing: '-0.5px',
            position: 'relative',
            paddingBottom: '15px'
          }}>Resume Matcher
            <div style={{
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '4px',
              backgroundColor: '#4CAF50',
              borderRadius: '2px'
            }}/>
          </h1>
          
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(10px)',
            padding: '35px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
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
                  fontWeight: '500',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {isAnalyzing ? (
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    justifyContent: 'center'
                  }}>
                    <LoadingSpinner size="small" color="white" />
                    <span>Analyzing Resume...</span>
                  </div>
                ) : (
                  'Analyze Resume'
                )}
                </button>
            </form>
          </div>
        </div>
      ) : (
        <ResultsPage />
      )}
    </>
  );
}

export default AIResumeMatcher; 