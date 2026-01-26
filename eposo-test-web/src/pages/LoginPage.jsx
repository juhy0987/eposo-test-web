import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setAccessToken } from '../services/api';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(true);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    setErrors({ ...errors, [name]: '', general: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '', general: '' });
    setIsLoading(true);

    try {
      const response = await login(formData);
      
      // Store access token
      setAccessToken(response.accessToken);
      
      // Store auto-login preference
      if (autoLogin) {
        localStorage.setItem('autoLogin', 'true');
      } else {
        localStorage.removeItem('autoLogin');
      }
      
      // Store user info
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Redirect to home or dashboard (for now, just show success)
      alert('Login successful!');
      
    } catch (error) {
      setIsLoading(false);
      
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.message;
        
        // Determine which field to show error under based on message content
        if (errorMessage.includes('email')) {
          setErrors({ ...errors, email: errorMessage });
        } else if (errorMessage.includes('password') || errorMessage.includes('Invalid password')) {
          setErrors({ ...errors, password: errorMessage });
        } else if (errorMessage.includes('locked') || errorMessage.includes('Account is locked')) {
          setErrors({ ...errors, general: errorMessage });
        } else {
          setErrors({ ...errors, general: errorMessage });
        }
      } else {
        setErrors({ ...errors, general: 'An unexpected error occurred. Please try again.' });
      }
      return;
    }
    
    setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Login</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Email Field */}
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
              border: errors.email ? '1px solid #dc3545' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {errors.email && (
            <p style={{ 
              color: '#dc3545', 
              fontSize: '12px', 
              marginTop: '5px',
              marginBottom: '0'
            }}>
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field with Toggle */}
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
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                paddingRight: '40px',
                boxSizing: 'border-box',
                border: errors.password ? '1px solid #dc3545' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '5px'
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.password && (
            <p style={{ 
              color: '#dc3545', 
              fontSize: '12px', 
              marginTop: '5px',
              marginBottom: '0'
            }}>
              {errors.password}
            </p>
          )}
        </div>

        {/* Auto Login Checkbox */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoLogin}
              onChange={(e) => setAutoLogin(e.target.checked)}
              style={{ marginRight: '8px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px' }}>Auto Login</span>
          </label>
        </div>

        {/* General Error Message */}
        {errors.general && (
          <p style={{ 
            color: '#dc3545', 
            fontSize: '14px', 
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px'
          }}>
            {errors.general}
          </p>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            cursor: isLoading ? 'not-allowed' : 'pointer',
            backgroundColor: isLoading ? '#6c757d' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* Link to Sign Up */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
        Don't have an account?{' '}
        <a 
          href="/signup" 
          style={{ color: '#007bff', textDecoration: 'none' }}
        >
          Sign up
        </a>
      </div>
    </div>
  );
}

export default LoginPage;
