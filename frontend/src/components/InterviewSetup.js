import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from './InterviewSetup-BG.jpg';

const ROLES = [
  // Engineering Roles
  "Software Developer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Mobile App Developer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Data Engineer",
  "Machine Learning Engineer",
  "AI Engineer",
  "Blockchain Developer",
  "Security Engineer",
  "QA Engineer",
  "Systems Engineer",
  "Network Engineer",
  "Database Administrator",
  
  // Data Roles
  "Data Scientist",
  "Data Analyst",
  "Business Analyst",
  "Business Intelligence Analyst",
  
  // Management & Design Roles
  "Project Manager",
  "Product Manager",
  "Scrum Master",
  "UI/UX Designer",
  "Technical Lead",
  "Engineering Manager",
  
  // Non-Engineering Roles
  "Marketing Manager",
  "Sales Manager",
  "HR Manager",
  "Financial Analyst",
  "Content Writer",
  "Digital Marketing Specialist",
  "Operations Manager",
  "Management Consultant",
  "Business Development Manager",
  "Account Manager",
  
  // Add Other at the end
  "Other"
];

function InterviewSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    experience: '',
    customRole: ''
  });
  const [showCustomRole, setShowCustomRole] = useState(false);

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setShowCustomRole(selectedRole === 'Other');
    setFormData({
      ...formData,
      role: selectedRole,
      customRole: selectedRole !== 'Other' ? '' : formData.customRole
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Only send role and experience
      const submissionData = {
        role: formData.role === 'Other' ? formData.customRole : formData.role,
        experience: formData.experience.toString()
      };

      console.log("Sending data to API:", submissionData);

      const response = await fetch('http://localhost:5000/generate_questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      localStorage.setItem('interviewQuestions', JSON.stringify(data));
      localStorage.setItem('interviewSetupData', JSON.stringify(submissionData));
      
      navigate('/interview');
    } catch (error) {
      console.error("Error:", error);
      alert(`Failed to setup interview: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      padding: '20px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '40px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
        margin: 'auto'
      }}>
        <h1 style={{
          color: '#2c3e50',
          marginBottom: '30px',
          textAlign: 'center',
          fontSize: '28px',
          fontWeight: '600'
        }}>Interview Setup</h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#34495e',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              Select Role:
            </label>
            <select
              value={formData.role}
              onChange={handleRoleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e0',
                backgroundColor: '#f8fafc',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
            >
              <option value="">Choose a role...</option>
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {showCustomRole && (
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#34495e',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                Specify Your Role:
              </label>
              <input
                type="text"
                value={formData.customRole}
                onChange={(e) => setFormData({...formData, customRole: e.target.value})}
                required
                placeholder="Enter your specific role"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e0',
                  backgroundColor: '#f8fafc',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#34495e',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              Years of Experience:
            </label>
            <input
              type="number"
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              required
              min="0"
              placeholder="Enter years of experience"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e0',
                backgroundColor: '#f8fafc',
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#94a3b8' : '#333333',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              transform: loading ? 'scale(1)' : 'scale(1)',
              hover: {
                backgroundColor: '#1a1a1a',
                transform: 'scale(1.02)'
              }
            }}
          >
            {loading ? 'Setting Up Interview...' : 'Start Interview'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default InterviewSetup; 