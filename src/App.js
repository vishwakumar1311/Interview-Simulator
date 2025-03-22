import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/resume-matcher" element={<AIResumeMatcher />} />
      <Route path="/resume-matcher/ats-results" element={<AIResumeMatcher />} />
      {/* ... other routes ... */}
    </Routes>
  );
}

export default App; 