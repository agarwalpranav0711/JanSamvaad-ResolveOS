import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Track from './pages/Track';
import Public from './pages/Public';
import Demo from './pages/Demo';
import Compliance from './pages/Compliance';
import Problem from './pages/Problem';
import Solution from './pages/Solution';
import Dashboard from './components/Dashboard';

/* Auth guard — redirects to /login if no token */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/track" element={<Track />} />
        <Route path="/public" element={<Public />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/problem" element={<Problem />} />
        <Route path="/solution" element={<Solution />} />
        <Route path="/login" element={<Dashboard />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
