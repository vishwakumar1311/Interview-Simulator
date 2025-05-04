import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from './InterviewSetup-BG.jpg'; // Reusing the same background image
import { Container, Box, Button, Typography } from '@mui/material';

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

function AssessmentSetup() {
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
      const submissionData = {
        role: formData.role === 'Other' ? formData.customRole : formData.role,
        experience: formData.experience.toString()
      };

      console.log("Sending data to API:", submissionData);

      // Store the setup data for the assessment
      localStorage.setItem('assessmentSetupData', JSON.stringify(submissionData));
      
      // Navigate to the assessment page
      navigate('/assessment');
    } catch (error) {
      console.error("Error:", error);
      alert(`Failed to setup assessment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  const AssessmentCard = ({ title, description, type, icon }) => (
    <div
      onClick={() => handleAssessmentSelect(type)}
      style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid #eef0f5',
        width: '220px',
        minWidth: '220px',
        height: '220px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
      }}
    >
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        marginBottom: '5px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        {icon}
      </div>
      <h3 style={{
        margin: '0',
        color: '#333',
        fontSize: '18px',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        {title}
      </h3>
      <p style={{
        margin: '0',
        color: '#666',
        textAlign: 'center',
        fontSize: '13px',
        lineHeight: '1.4',
        maxWidth: '180px'
      }}>
        {description}
      </p>
      <div style={{
        marginTop: 'auto',
        backgroundColor: '#f8f9fa',
        padding: '6px 12px',
        borderRadius: '4px',
        color: '#4a5568',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        Click to Start
      </div>
    </div>
  );

  const handleAssessmentSelect = async (type) => {
    setLoading(true);
    try {
      // Store the assessment type
      localStorage.setItem('assessmentType', type);
      
      // Navigate to the appropriate page based on assessment type
      if (type === 'aptitude') {
        navigate('/aptitude');
      } else {
        navigate('/assessment');
      }
    } catch (error) {
      console.error("Error:", error);
      alert(`Failed to setup assessment: ${error.message}`);
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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '30px',
        width: '100%',
        maxWidth: '1200px',
        position: 'relative'
      }}>
        <button
          onClick={handleGoToHome}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '8px 16px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e9ecef';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }}
        >
          <span style={{ fontSize: '20px' }}>←</span>
          Back to Home
        </button>

        <h1 style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: '#2c3e50',
          fontSize: '2.5rem',
          fontWeight: '600'
        }}>
          Choose Your Assessment Type
        </h1>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '40px',
          flexDirection: 'row',
          margin: '0 auto',
          padding: '20px'
        }}>
          <AssessmentCard
            title="Aptitude Test"
            description="Test your logical reasoning, numerical ability, and problem-solving skills."
            type="aptitude"
            icon="🧮"
          />


          <AssessmentCard
            title="Coding Challenge"
            description="Solve real-world programming problems and demonstrate your coding skills."
            type="coding"
            icon="👨‍💻"
          />
        </div>

        {loading && (
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            color: '#666'
          }}>
            Setting up your assessment...
          </div>
        )}
      </div>
    </div>
  );
}

export default AssessmentSetup; 