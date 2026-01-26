import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, clearAuthData, getAccessToken } from '../services/api';

function Header() {
  const navigate = useNavigate();
  const isLoggedIn = !!getAccessToken();

  const handleLogout = async () => {
    try {
      // Call logout API
      await logout();
      
      // Clear all client-side session data
      clearAuthData();
      
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local data and redirect
      clearAuthData();
      navigate('/login');
    }
  };

  if (!isLoggedIn) {
    return null; // Don't show header if not logged in
  }

  return (
    <header style={{
      backgroundColor: '#343a40',
      padding: '15px 30px',
      color: '#fff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
        Eposo Test App
      </div>
      
      <button
        onClick={handleLogout}
        style={{
          backgroundColor: '#dc3545',
          color: '#fff',
          border: 'none',
          padding: '8px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        Logout
      </button>
    </header>
  );
}

export default Header;
