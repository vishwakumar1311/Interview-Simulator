import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      backgroundColor: '#f5f5f5',
      padding: '15px',
      borderRadius: '5px',
      marginBottom: '15px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '10px' }}>{title}</h3>
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
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: '3px solid',
        borderColor: score >= 80 ? '#4CAF50' : score >= 60 ? '#FFA726' : '#F44336',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        {score}%
      </div>
      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh',
      padding: '20px'
    }}>
      <h1 style={{ marginBottom: '30px' }}>AI Resume Matcher</h1>
      
      <div style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <label htmlFor="resume" style={{ fontWeight: 'bold' }}>Upload Resume (PDF)</label>
            <input
              type="file"
              id="resume"
              accept=".pdf"
              onChange={handleResumeUpload}
              style={{
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '5px'
              }}
            />
            {resume && <p style={{ color: 'green' }}>Resume uploaded: {resume.name}</p>}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <label htmlFor="jobDescription" style={{ fontWeight: 'bold' }}>Job Description</label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={handleJobDescriptionChange}
              placeholder="Paste the job description here..."
              style={{
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                minHeight: '200px',
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={isAnalyzing}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: isAnalyzing ? '#cccccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Resume Match'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Back to Home
            </button>
          </div>
        </form>

        {analysisResults && (
          <div style={{
            marginTop: '30px',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: 'white'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Analysis Results</h2>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <ScoreDisplay score={analysisResults.atsScore} label="ATS Score" />
              <ScoreDisplay score={analysisResults.similarityScore} label="Similarity Score" />
            </div>

            <ResultSection title="Keyword Analysis">
              <p><strong>Match Rate:</strong> {analysisResults.breakdown.keywordMatch.score}%</p>
              <p><strong>Matched Keywords:</strong> {analysisResults.breakdown.keywordMatch.matched.join(', ')}</p>
              <p><strong>Missing Keywords:</strong> {analysisResults.breakdown.keywordMatch.missing.join(', ')}</p>
            </ResultSection>

            <ResultSection title="Skills Alignment">
              <p><strong>Match Rate:</strong> {analysisResults.breakdown.skillsAlignment.score}%</p>
              <p><strong>Matched Skills:</strong> {analysisResults.breakdown.skillsAlignment.matched.join(', ')}</p>
              <p><strong>Missing Skills:</strong> {analysisResults.breakdown.skillsAlignment.missing.join(', ')}</p>
            </ResultSection>

            <ResultSection title="Experience & Education">
              <p><strong>Experience Relevance:</strong> {analysisResults.breakdown.experienceRelevance.score}%</p>
              <p><strong>Strengths:</strong> {analysisResults.breakdown.experienceRelevance.strengths.join(', ')}</p>
              <p><strong>Gaps:</strong> {analysisResults.breakdown.experienceRelevance.gaps.join(', ')}</p>
              <p><strong>Education Match:</strong> {analysisResults.breakdown.educationMatch.score}%</p>
            </ResultSection>

            <ResultSection title="Job Title Relevance">
              <p><strong>Match Level:</strong> {analysisResults.breakdown.jobTitleRelevance.matchLevel}</p>
              <p><strong>Suggested Titles:</strong> {analysisResults.breakdown.jobTitleRelevance.suggestedTitles.join(', ')}</p>
            </ResultSection>

            <ResultSection title="Suggested Improvements">
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {analysisResults.improvements.map((improvement, index) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </ResultSection>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIResumeMatcher; 