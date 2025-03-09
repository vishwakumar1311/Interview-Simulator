import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical",
  "Other"
];

const ROLES = [
  "Software Developer",
  "Data Scientist",
  "DevOps Engineer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "System Analyst",
  "Project Manager",
  "Other"
];

function InterviewSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    branch: '',
    role: '',
    experience: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Sending request with data:", formData); // Debug log

      const response = await fetch('http://localhost:5000/generate_questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log("Response status:", response.status); // Debug log
      const data = await response.json();
      console.log("Response data:", data); // Debug log
      
      if (response.status !== 200) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      // Store questions in localStorage
      localStorage.setItem('interviewQuestions', JSON.stringify(data.questions));
      
      // Navigate to interview page
      navigate('/interview');
    } catch (error) {
      console.error('Detailed error:', error); // Debug log
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h1>Interview Setup</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label>
            Branch:
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({...formData, branch: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>
            Role:
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>
            Years of Experience:
            <input
              type="number"
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              required
              min="0"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px'
              }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generating Questions...' : 'Start Interview'}
        </button>
      </form>
    </div>
  );
}

export default InterviewSetup; 