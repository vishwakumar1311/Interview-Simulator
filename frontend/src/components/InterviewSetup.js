import React, { useState, useEffect, useRef } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredRoles = ROLES.filter(role =>
    role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRoleChange = (role) => {
    setShowCustomRole(role === 'Other');
    setFormData({
      ...formData,
      role: role,
      customRole: role !== 'Other' ? '' : formData.customRole
    });
    setSearchTerm(role);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
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
      
      navigate('/device-setup');
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
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
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
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
        margin: 'auto',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{
          color: '#1a365d',
          marginBottom: '40px',
          textAlign: 'center',
          fontSize: '32px',
          fontWeight: '700',
          letterSpacing: '-0.5px'
        }}>Interview Setup</h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '30px', position: 'relative' }} ref={dropdownRef}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              color: '#2d3748',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Select Role:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setShowDropdown(true)}
              placeholder="Select a role..."
              required
              ref={inputRef}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box',
                '&:focus': {
                  borderColor: '#4299e1',
                  boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.2)'
                }
              }}
            />
            {showDropdown && (
              <ul style={{
                position: 'absolute',
                width: '100%',
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                marginTop: '5px',
                zIndex: 1000,
                listStyleType: 'none',
                padding: '8px 0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {filteredRoles.map(role => (
                  <li
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: formData.role === role ? '#ebf8ff' : 'white',
                      color: formData.role === role ? '#2b6cb0' : '#2d3748',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#f7fafc'
                      }
                    }}
                  >
                    {role}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {showCustomRole && (
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                color: '#2d3748',
                fontSize: '16px',
                fontWeight: '600'
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
                  padding: '15px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  boxSizing: 'border-box',
                  '&:focus': {
                    borderColor: '#4299e1',
                    boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.2)'
                  }
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              color: '#2d3748',
              fontSize: '16px',
              fontWeight: '600'
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
                padding: '15px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box',
                '&:focus': {
                  borderColor: '#4299e1',
                  boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.2)'
                }
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: loading ? '#90cdf4' : '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(66, 153, 225, 0.2)',
              '&:hover': {
                backgroundColor: loading ? '#90cdf4' : '#3182ce',
                transform: loading ? 'none' : 'translateY(-2px)',
                boxShadow: '0 6px 8px rgba(66, 153, 225, 0.3)'
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 2px 4px rgba(66, 153, 225, 0.2)'
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