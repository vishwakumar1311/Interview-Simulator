import React, { useEffect } from 'react';

const NoCopyPaste = () => {
  useEffect(() => {
    // Prevent copy
    const preventCopy = (e) => {
      e.preventDefault();
    };

    // Prevent paste
    const preventPaste = (e) => {
      e.preventDefault();
    };

    // Prevent cut
    const preventCut = (e) => {
      e.preventDefault();
    };

    // Add event listeners
    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);
    document.addEventListener('cut', preventCut);

    // Add CSS to disable text selection
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventPaste);
      document.removeEventListener('cut', preventCut);
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

export default NoCopyPaste; 