import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation
    if (!formData.identifier.trim() && !formData.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!formData.identifier.trim()) {
      setError('Please enter your phone number or email');
      return;
    }

    if (!formData.password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const response = await login({ 
        identifier: formData.identifier.trim(),
        password: formData.password 
      });
      
      loginUser(response.data.token, response.data.user);
      
      // Check if there's a redirect from state
      const from = location.state?.from;
      const date = location.state?.date;
      const time = location.state?.time;
      
      if (response.data.user.isAdmin) {
        navigate('/admin');
      } else if (from && date && time) {
        navigate('/book', { state: { date, time } });
      } else if (from) {
        navigate(from);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Login to Your Account</h2>

        {location.state?.date && (
          <div style={{ 
            padding: '15px', 
            background: '#fff3cd', 
            borderRadius: '10px', 
            marginBottom: '20px',
            textAlign: 'center',
            color: '#856404'
          }}>
            <strong>📅 Selected:</strong> {location.state.date} at {location.state.time}
            <br />
            <small>Login to complete your booking</small>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Phone Number or Email *
            </label>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter phone number or email"
              autoComplete="username"
            />
            <div className="form-note">
              You can login with either your phone number (10 digits) or email address
            </div>
          </div>

          <div className="form-group">
            <label>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <div className="modal-footer" style={{ marginBottom: '25px' }}>
            <Link to="/forgot-password" style={{ color: '#e67e22', fontWeight: '600', textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={() => navigate('/')}
              className="btn-modal btn-modal-cancel"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-modal btn-modal-submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <div className="modal-footer" style={{ marginTop: '30px' }}>
          Don't have an account?
          <Link to="/register" state={location.state}>Create New Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;