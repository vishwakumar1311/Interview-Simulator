import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import VideoFeed from "./components/VideoFeed";
import Home from "./components/Home";
import AIResumeMatcher from "./components/AIResumeMatcher";
import OnlineAssessment from "./components/OnlineAssessment";
import InterviewSetup from './components/InterviewSetup';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

function App() {
  // Check if user is authenticated
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated() ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated() ? <Navigate to="/" replace /> : <Register />} 
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <InterviewSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <VideoFeed />
            </ProtectedRoute>
          }
        />
        <Route path="/resume-matcher" element={<AIResumeMatcher />} />
        <Route path="/assessment" element={<OnlineAssessment />} />

        {/* Catch all route - redirect to login if not authenticated, home if authenticated */}
        <Route 
          path="*" 
          element={isAuthenticated() ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
