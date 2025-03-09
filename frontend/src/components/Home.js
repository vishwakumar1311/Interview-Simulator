import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from './LoadingSpinner';
import bgImage from './Home-BG.jpg';

// Add global style for background
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
  }
`;

function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    
    // Stop camera when arriving at home page
    fetch('http://localhost:5000/stop_camera', {
      method: 'POST'
    }).catch(error => {
      console.error('Error stopping camera:', error);
    });

    return () => clearTimeout(timer);
  }, []);

  const handleInterviewClick = async () => {
    try {
      // First stop any existing camera/recording
      await fetch('http://localhost:5000/stop_camera', {
        method: 'POST'
      });
      
      // Navigate and force reload
      navigate('/interview');
      window.location.reload();
    } catch (error) {
      console.error('Error resetting camera:', error);
      // Navigate and force reload even on error
      navigate('/interview');
      window.location.reload();
    }
  };

  const FeatureCard = ({ title, description, onClick, icon, color }) => (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '25px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid #eef0f5',
        width: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
        position: 'relative',
        overflow: 'hidden'
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
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '10px'
      }}>
        <span style={{ fontSize: '24px', color: 'white' }}>{icon}</span>
      </div>
      <h3 style={{
        margin: '0',
        color: '#333',
        fontSize: '20px',
        fontWeight: '600',
        textAlign: 'center'
      }}>{title}</h3>
      <p style={{
        margin: '0',
        color: '#666',
        textAlign: 'center',
        fontSize: '14px',
        lineHeight: '1.6'
      }}>{description}</p>
    </div>
  );

  const Header = () => (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '70px',
      backgroundColor: 'white',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '0 40px'
    }}>
      <h2 style={{
        margin: 0,
        fontSize: '24px',
        fontWeight: '600',
        color: '#333',
        fontFamily: "'Poppins', sans-serif"
      }}>Interview Kit</h2>
    </header>
  );

  const Footer = () => (
    <footer style={{
      backgroundColor: 'white',
      padding: '40px 20px',
      boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '40px'
      }}>
        <div style={{
          flex: '1',
          minWidth: '250px'
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            color: '#333',
            fontSize: '20px',
            fontWeight: '600',
            fontFamily: "'Poppins', sans-serif"
          }}>Interview Kit</h3>
          <p style={{
            color: '#666',
            fontSize: '14px',
            lineHeight: '1.6',
            margin: '0'
          }}>Empowering job seekers with AI-driven interview preparation tools.</p>
        </div>

        <div style={{
          flex: '1',
          minWidth: '250px'
        }}>
          <h4 style={{
            margin: '0 0 15px 0',
            color: '#333',
            fontSize: '16px',
            fontWeight: '600',
            fontFamily: "'Poppins', sans-serif"
          }}>Quick Links</h4>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <button
              onClick={() => navigate('/resume-matcher')}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                fontSize: '14px',
                padding: '4px 0',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
              onMouseLeave={(e) => e.target.style.color = '#666'}
            >
              Resume Matcher
            </button>
            <button
              onClick={handleInterviewClick}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                fontSize: '14px',
                padding: '4px 0',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
              onMouseLeave={(e) => e.target.style.color = '#666'}
            >
              Interview Simulator
            </button>
            <button
              onClick={() => navigate('/assessment')}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                fontSize: '14px',
                padding: '4px 0',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
              onMouseLeave={(e) => e.target.style.color = '#666'}
            >
              Online Assessment
            </button>
          </div>
        </div>

        <div style={{
          flex: '1',
          minWidth: '250px'
        }}>
          <h4 style={{
            margin: '0 0 15px 0',
            color: '#333',
            fontSize: '16px',
            fontWeight: '600',
            fontFamily: "'Poppins', sans-serif"
          }}>Contact</h4>
          <p style={{
            color: '#666',
            fontSize: '14px',
            lineHeight: '1.6',
            margin: '0'
          }}>
            Have questions? Reach out to us at<br />
            comingsoon@gmail.com
          </p>
        </div>
      </div>
      
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto 0',
        padding: '20px 0 0',
        borderTop: '1px solid #eef0f5',
        textAlign: 'center'
      }}>
        <p style={{
          color: '#999',
          fontSize: '14px',
          margin: '0'
        }}>
          © {new Date().getFullYear()} Interview Kit. All rights reserved.
        </p>
      </div>
    </footer>
  );

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#ebeef2'
      }}>
        <LoadingSpinner size="large" color="#3D3D3D" />
      </div>
    );
  }

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'transparent'
      }}>
        <Header />
        <main style={{ 
          flex: 1,
          padding: '110px 20px 40px',
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#333',
              marginBottom: '20px',
              fontFamily: "'Poppins', sans-serif"
            }}>Interview Kit</h1>
            
            <p style={{
              fontSize: '18px',
              color: '#666',
              marginBottom: '60px',
              maxWidth: '600px',
              margin: '0 auto 60px',
              lineHeight: '1.6'
            }}>
              Enhance your interview preparation with our comprehensive toolkit
            </p>

            <div style={{
              display: 'flex',
              gap: '30px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              padding: '20px'
            }}>
              <FeatureCard
                title="AI Resume Matcher"
                description="Get instant feedback on how well your resume matches the job description using advanced AI analysis."
                onClick={() => navigate('/resume-matcher')}
                icon="📄"
                color="#A1A1A1"
              />

              <FeatureCard
                title="Interview Simulator"
                description="Practice your interview skills with our real-time emotion analysis and feedback system."
                onClick={handleInterviewClick}
                icon="🎥"
                color="#A1A1A1"
              />

              <FeatureCard
                title="Online Assessment"
                description="Test your technical skills with our comprehensive online assessment platform."
                onClick={() => navigate('/assessment')}
                icon="✍️"
                color="#A1A1A1"
              />
            </div>

            <p style={{ 
              marginTop: '40px', 
              color: '#999',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              Note: Online Assessment feature is coming soon!
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

export default Home; 