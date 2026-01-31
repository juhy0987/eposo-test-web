import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import FileUploadPage from './pages/FileUploadPage';

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/upload" element={<FileUploadPage />} />
      <Route path="/" element={<FileUploadPage />} />
    </Routes>
  );
}

export default App;