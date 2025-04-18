import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import VideoFeed from "./VideoFeed";
import Login from './Auth/Login';
import Register from './Auth/Register';
import AptitudeTest from './AptitudeTest';

const InterviewSimulator = () => {
  // Check if user is authenticated
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/interview"
          element={
            isAuthenticated() ? (
              <VideoFeed />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/aptitude"
          element={
            isAuthenticated() ? (
              <AptitudeTest />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default InterviewSimulator; 