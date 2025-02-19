import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VideoFeed from "./components/VideoFeed";
import Home from "./components/Home";
import AIResumeMatcher from "./components/AIResumeMatcher";
import OnlineAssessment from "./components/OnlineAssessment";

function App() {
  return (
    <Router>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interview" element={<VideoFeed />} />
          <Route path="/resume-matcher" element={<AIResumeMatcher />} />
          <Route path="/assessment" element={<OnlineAssessment />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
