import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = '#3D3D3D', overlay = false }) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: '20px', height: '20px', border: '3px solid' };
      case 'large':
        return { width: '50px', height: '50px', border: '6px solid' };
      default: // medium
        return { width: '35px', height: '35px', border: '4px solid' };
    }
  };

  const spinnerStyle = {
    ...getSize(),
    borderRadius: '50%',
    borderColor: `${color} transparent transparent transparent`,
    animation: 'spin 1s linear infinite',
    margin: 'auto',
  };

  const overlayStyle = overlay ? {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  } : {};

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      {overlay ? (
        <div style={overlayStyle}>
          <div style={spinnerStyle} />
        </div>
      ) : (
        <div style={spinnerStyle} />
      )}
    </>
  );
};

export default LoadingSpinner; 