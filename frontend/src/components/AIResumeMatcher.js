import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from './LoadingSpinner';
import bgImage from './ResumeMatcher-BG.jpg';

// Add global style to ensure the background covers everything
const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

  body {
    margin: 0;
    padding: 0;
    background-image: url(${bgImage});
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    background-repeat: no-repeat;
    min-height: 100vh;
    color: #000;
    font-family: 'Poppins', sans-serif;
  }

  h1, h2, h3 {
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
  }

  input, textarea {
    background-color: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.2) !important;
    color: #000 !important;
    font-family: 'Poppins', sans-serif;
    letter-spacing: 0.2px;
  }

  input::placeholder, textarea::placeholder {
    color: rgba(0, 0, 0, 0.6);
    font-style: italic;
    font-weight: 300;
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: rgba(0, 0, 0, 0.5) !important;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }

  button {
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
`;

function AIResumeMatcher() {
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResume(file);
      setAnalysisResults(null); // Reset results when new resume is uploaded
    } else {
      alert('Please upload a PDF file for the resume');
    }
  };

  const handleJobDescriptionChange = (event) => {
    setJobDescription(event.target.value);
    setAnalysisResults(null); // Reset results when job description changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume || !jobDescription.trim()) {
      alert('Please upload a resume and enter the job description');
      return;
    }

    setIsAnalyzing(true);
    try {
      // TODO: Replace with actual API call
      // Simulated API response for now
      const mockAnalysis = {
        atsScore: 85,
        similarityScore: 78,
        breakdown: {
          keywordMatch: {
            score: 82,
            matched: ['python', 'react', 'javascript'],
            missing: ['aws', 'docker']
          },
          skillsAlignment: {
            score: 85,
            matched: ['web development', 'frontend development'],
            missing: ['cloud computing']
          },
          experienceRelevance: {
            score: 88,
            strengths: ['relevant industry experience', 'project leadership'],
            gaps: ['international experience']
          },
          educationMatch: {
            score: 90,
            matches: ['Bachelor\'s degree in Computer Science'],
            suggestions: []
          },
          jobTitleRelevance: {
            score: 85,
            matchLevel: 'High',
            suggestedTitles: ['Senior Software Engineer', 'Lead Developer']
          }
        },
        improvements: [
          'Add AWS certification or cloud experience',
          'Include more DevOps-related skills',
          'Highlight international collaboration if any'
        ]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAnalysisResults(mockAnalysis);
    } catch (error) {
      alert('Error analyzing resume. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ResultSection = ({ title, children }) => (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(10px)',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
    }}>
      <h3 style={{ 
        marginTop: 0, 
        marginBottom: '15px', 
        color: '#000',
        fontSize: '1.5rem',
        fontWeight: '600',
        letterSpacing: '-0.5px',
        borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
        paddingBottom: '8px'
      }}>{title}</h3>
      {children}
    </div>
  );

  const ScoreDisplay = ({ score, label }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px'
    }}>
      <div style={{
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        border: '3px solid',
        borderColor: score >= 80 ? '#4CAF50' : score >= 60 ? '#FFA726' : '#F44336',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        color: '#000',
        backdropFilter: 'blur(10px)'
      }}>
        {score}%
      </div>
      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>{label}</span>
    </div>
  );

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ 
        display: 'flex',
        minHeight: '100%',
        justifyContent: 'flex-end',
        padding: '2rem'
      }}>
        <div style={{
          width: '50%',
          minWidth: '600px',
          maxWidth: '800px',
          minHeight: '100%',
        }}>
          <h1 style={{ 
            marginBottom: '40px',
            color: '#000',
            fontSize: '3.5rem',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(255, 255, 255, 0.5)',
            fontWeight: '700',
            fontFamily: "'Poppins', sans-serif",
            lineHeight: '1.2'
          }}>AI Resume Matcher</h1>
          
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '25px',
            marginBottom: '40px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <label htmlFor="resume" style={{ 
                fontWeight: '600',
                color: '#000',
                fontSize: '1.25rem',
                textShadow: '1px 1px 2px rgba(255, 255, 255, 0.5)',
                letterSpacing: '0.2px',
                textTransform: 'uppercase'
              }}>Upload Resume (PDF)</label>
              <input
                type="file"
                id="resume"
                accept=".pdf"
                onChange={handleResumeUpload}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              />
              {resume && <p style={{ 
                color: '#4CAF50',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '8px 0',
                textShadow: '1px 1px 2px rgba(255, 255, 255, 0.5)',
                fontSize: '0.95rem',
                fontWeight: '500',
                letterSpacing: '0.2px'
              }}>
                <span>✓</span>
                <span>Resume uploaded: {resume.name}</span>
              </p>}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <label htmlFor="jobDescription" style={{ 
                fontWeight: '600',
                color: '#000',
                fontSize: '1.25rem',
                textShadow: '1px 1px 2px rgba(255, 255, 255, 0.5)',
                letterSpacing: '0.2px',
                textTransform: 'uppercase'
              }}>Job Description</label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={handleJobDescriptionChange}
                placeholder="Paste the job description here..."
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  minHeight: '200px',
                  resize: 'vertical',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  letterSpacing: '0.2px'
                }}
              />
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              marginTop: '25px'
            }}>
              <button
                type="submit"
                disabled={isAnalyzing}
                style={{
                  padding: '16px 32px',
                  fontSize: '1rem',
                  backgroundColor: isAnalyzing ? 'rgba(204, 204, 204, 0.9)' : 'rgba(76, 175, 80, 0.9)',
                  color: '#000',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '10px',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}
              >
                {isAnalyzing ? (
                  <>
                    <LoadingSpinner size="small" color="#3D3D3D" />
                    <span>Analyzing...</span>
                  </>
                ) : 'Analyze Resume Match'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  padding: '16px 32px',
                  fontSize: '1rem',
                  backgroundColor: 'rgba(33, 150, 243, 0.9)',
                  color: '#000',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}
              >
                Back to Home
              </button>
            </div>
          </form>

          {analysisResults && (
            <div style={{
              marginBottom: '2rem'
            }}>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '30px',
                color: '#000',
                fontSize: '2.5rem',
                textShadow: '2px 2px 4px rgba(255, 255, 255, 0.5)',
                fontWeight: '600',
                letterSpacing: '-0.5px',
                textAlign: 'center'
              }}>Analysis Results</h2>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <ScoreDisplay score={analysisResults.atsScore} label="ATS Score" />
                <ScoreDisplay score={analysisResults.similarityScore} label="Similarity Score" />
              </div>

              <ResultSection title="Keyword Analysis">
                <p><strong style={{color: '#000'}}>Match Rate:</strong> <span style={{color: '#000'}}>{analysisResults.breakdown.keywordMatch.score}%</span></p>
                <p><strong style={{color: '#000'}}>Matched Keywords:</strong> <span style={{color: '#000'}}>{analysisResults.breakdown.keywordMatch.matched.join(', ')}</span></p>
                <p><strong style={{color: '#000'}}>Missing Keywords:</strong> <span style={{color: '#000'}}>{analysisResults.breakdown.keywordMatch.missing.join(', ')}</span></p>
              </ResultSection>

              <ResultSection title="Skills Alignment">
                <p><strong style={{color: '#000'}}>Match Rate:</strong> <span style={{color: '#000'}}>{analysisResults.breakdown.skillsAlignment.score}%</span></p>
                <p><strong style={{color: '#000'}}>Matched Skills:</strong> <span style={{color: '#000'}}>{analysisResults.breakdown.skillsAlignment.matched.join(', ')}</span></p>
                <p><strong style={{color: '#000'}}>Missing Skills:</strong> <span style={{color: '#000'}}>{analysisResults.breakdown.skillsAlignment.missing.join(', ')}</span></p>
              </ResultSection>

              <ResultSection title="Experience & Education">
                <p><strong style={{color: '#000'}}>Experience Relevance:</strong> <span style={{color: '#000'}}>{analysisResults.breakdown.experienceRelevance.score}%</span></p>
                <p><strong style={{color: '#000'}}>Strengths:</strong> <span style={{color: '#000'}}>{analysisResults.breakdown.experienceRelevance.strengths.join(', ')}</span></p>
                <p><strong style={{color: '#000'}}>Gaps:</strong> <span style={{color: '#000'}}>{analysisResults.breakdown.experienceRelevance.gaps.join(', ')}</span></p>
                <p><strong style={{color: '#000'}}>Education Match:</strong> <span style={{color: '#000'}}>{analysisResults.breakdown.educationMatch.score}%</span></p>
              </ResultSection>

              <ResultSection title="Job Title Relevance">
                <p><strong style={{color: '#000'}}>Match Level:</strong> <span style={{color: '#000'}}>{analysisResults.breakdown.jobTitleRelevance.matchLevel}</span></p>
                <p><strong style={{color: '#000'}}>Suggested Titles:</strong> <span style={{color: '#000'}}>{analysisResults.breakdown.jobTitleRelevance.suggestedTitles.join(', ')}</span></p>
              </ResultSection>

              <ResultSection title="Suggested Improvements">
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#000' }}>
                  {analysisResults.improvements.map((improvement, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>{improvement}</li>
                  ))}
                </ul>
              </ResultSection>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AIResumeMatcher; 