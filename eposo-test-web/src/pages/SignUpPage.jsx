import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from '../services/api';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  const [errors, setErrors] = useState([]);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setApiError('');
    try {
      await signUp(formData);
      navigate('/login');
    } catch (error) {
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (Array.isArray(errorData.message)) {
          setErrors(errorData.message);
        } else {
          setApiError(errorData.message);
        }
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '50px auto', 
      padding: '30px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      backgroundColor: '#fff'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Sign Up</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="email"
            style={{ 
              display: 'block', 
              marginBottom: '5px',
              fontWeight: '500'
            }}
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              boxSizing: 'border-box',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="password"
            style={{ 
              display: 'block', 
              marginBottom: '5px',
              fontWeight: '500'
            }}
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              boxSizing: 'border-box',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="passwordConfirmation"
            style={{ 
              display: 'block', 
              marginBottom: '5px',
              fontWeight: '500'
            }}
          >
            Confirm Password
          </label>
          <input
            type="password"
            name="passwordConfirmation"
            id="passwordConfirmation"
            value={formData.passwordConfirmation}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              boxSizing: 'border-box',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        {apiError && (
          <p style={{ 
            color: '#dc3545', 
            fontSize: '14px', 
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px'
          }}>
            {apiError}
          </p>
        )}
        
        {errors.length > 0 && (
          <ul style={{ 
            color: '#dc3545', 
            paddingLeft: '20px',
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        )}

        <button 
          type="submit" 
          style={{ 
            width: '100%', 
            padding: '12px', 
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Sign Up
        </button>
      </form>

      {/* Link to Login */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
        Already have an account?{' '}
        <a 
          href="/login" 
          style={{ color: '#007bff', textDecoration: 'none' }}
        >
          Login
        </a>
      </div>
    </div>
  );
};

export default SignUpPage;
