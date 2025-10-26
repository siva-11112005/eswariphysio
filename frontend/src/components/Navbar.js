import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top Header */}
      <div className="top-header">
        <div className="top-header-content">
          <div className="header-contact">
            <span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {process.env.REACT_APP_ADMIN_PHONE || '+919524350214'}
            </span>
            <span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              eswaripalani2002@gmail.com
            </span>
          </div>
          <div className="header-auth">
            {!user ? (
              <>
                <button onClick={() => navigate('/login')} className="btn-header btn-login">
                  Log In
                </button>
                <button onClick={() => navigate('/register')} className="btn-header btn-signup">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <span>Welcome, {user.name}!</span>
                <button onClick={handleLogout} className="btn-header btn-logout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="main-nav">
        <div className="main-nav-content">
          <h2 className="clinic-name">ESWARI PHYSIOTHERAPY</h2>
          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              HOME
            </Link>
            {user && !user.isAdmin && (
              <>
                <Link to="/book" className={`nav-link ${isActive('/book') ? 'active' : ''}`}>
                  BOOK APPOINTMENT
                </Link>
                <Link to="/my-appointments" className={`nav-link ${isActive('/my-appointments') ? 'active' : ''}`}>
                  MY BOOKINGS
                </Link>
              </>
            )}
            {user && user.isAdmin && (
              <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                ADMIN PANEL
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;