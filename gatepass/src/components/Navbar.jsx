import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <span className="logo-part-1">Gate</span>
            <span className="logo-part-2">Pass</span>
          </div>
        </Link>
        
        {/* Desktop menu */}
        <div className="navbar-menu">
          <div className="navbar-links">
            {user && (
              <>
                {user.role === 'faculty' && (
                  <>
                    <Link
                      to="/apply"
                      className={`nav-link ${isActive('/apply') ? 'active' : ''}`}
                    >
                      Apply Request
                    </Link>
                    <Link
                      to="/my-requests"
                      className={`nav-link ${isActive('/my-requests') ? 'active' : ''}`}
                    >
                      My Requests
                    </Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/apply"
                      className={`nav-link ${isActive('/apply') ? 'active' : ''}`}
                    >
                      Apply Request
                    </Link>
                    <Link
                      to="/my-requests"
                      className={`nav-link ${isActive('/my-requests') ? 'active' : ''}`}
                    >
                      My Requests
                    </Link>
                    <Link
                      to="/pending-requests"
                      className={`nav-link ${isActive('/pending-requests') ? 'active' : ''}`}
                    >
                      Pending Requests
                    </Link>
                    <Link
                      to="/update-requests"
                      className={`nav-link ${isActive('/update-requests') ? 'active' : ''}`}
                    >
                      All Requests
                    </Link>
                  </>
                )}
                {user.role === 'viewer' && (
                  <>
                    <Link
                      to="/viewer/all-requests"
                      className={`nav-link ${isActive('/viewer/all-requests') ? 'active' : ''}`}
                    >
                      All Requests
                    </Link>
                    <Link
                      to="/viewer/allowed-requests"
                      className={`nav-link ${isActive('/viewer/allowed-requests') ? 'active' : ''}`}
                    >
                      Allowed Requests
                    </Link>
                  </>
                )}
                {user.role === 'registrar' && (
                  <>
                    <Link
                      to="/registrar-dashboard"
                      className={`nav-link ${isActive('/registrar-dashboard') ? 'active' : ''}`}
                    >
                      Pending Requests
                    </Link>
                    <Link
                      to="/registrar/all-requests"
                      className={`nav-link ${isActive('/registrar/all-requests') ? 'active' : ''}`}
                    >
                      All Requests
                    </Link>
                  </>
                )}
                {user.role === 'principal' && (
                  <>
                    <Link
                      to="/principal/pending-requests"
                      className={`nav-link ${isActive('/principal/pending-requests') ? 'active' : ''}`}
                    >
                      Pending Requests
                    </Link>
                    <Link
                      to="/principal/all-requests"
                      className={`nav-link ${isActive('/principal/all-requests') ? 'active' : ''}`}
                    >
                      All Requests
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
          
          {user ? (
            <div className="user-section">
              <div className="welcome-text">
                Welcome, <span className="user-name">{user.name}</span>
                <span className="user-role"> ({user.role})</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-primary"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link
                to="/login"
                className="btn btn-primary"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-secondary"
              >
                Register
              </Link>
            </div>
          )}
        </div>
        
        {/* Mobile menu button */}
        <button
          onClick={toggleMenu}
          className="mobile-menu-button"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>
      
      {/* Mobile menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-links">
          {user && (
            <>
              {user.role === 'faculty' && (
                <>
                  <Link
                    to="/apply"
                    className={`mobile-link ${isActive('/apply') ? 'active' : ''}`}
                    onClick={toggleMenu}
                  >
                    Apply Request
                  </Link>
                  <Link
                    to="/my-requests"
                    className={`mobile-link ${isActive('/my-requests') ? 'active' : ''}`}
                    onClick={toggleMenu}
                  >
                    My Requests
                  </Link>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Link
                    to="/apply"
                    className={`mobile-link ${isActive('/apply') ? 'active' : ''}`}
                    onClick={toggleMenu}
                  >
                    Apply Request
                  </Link>
                  <Link
                    to="/my-requests"
                    className={`mobile-link ${isActive('/my-requests') ? 'active' : ''}`}
                    onClick={toggleMenu}
                  >
                    My Requests
                  </Link>
                  <Link
                    to="/pending-requests"
                    className={`mobile-link ${isActive('/pending-requests') ? 'active' : ''}`}
                    onClick={toggleMenu}
                  >
                    Pending Requests
                  </Link>
                  <Link
                    to="/update-requests"
                    className={`mobile-link ${isActive('/update-requests') ? 'active' : ''}`}
                    onClick={toggleMenu}
                  >
                    All Requests
                  </Link>
                </>
              )}
              {user.role === 'viewer' && (
                <>
                  <Link
                    to="/viewer/all-requests"
                    className={`mobile-link ${isActive('/viewer/all-requests') ? 'active' : ''}`}
                    onClick={toggleMenu}
                  >
                    All Requests
                  </Link>
                  <Link
                    to="/viewer/allowed-requests"
                    className={`mobile-link ${isActive('/viewer/allowed-requests') ? 'active' : ''}`}
                    onClick={toggleMenu}
                  >
                    Allowed Requests
                  </Link>
                </>
              )}
              {user.role === 'registrar' && (
                <>
                  <Link
                    to="/registrar-dashboard"
                    className={`mobile-link ${isActive('/registrar-dashboard') ? 'active' : ''}`}
                    onClick={toggleMenu}
                  >
                    Pending Requests
                  </Link>
                  <Link
                    to="/registrar/all-requests"
                    className={`mobile-link ${isActive('/registrar/all-requests') ? 'active' : ''}`}
                    onClick={toggleMenu}
                  >
                    All Requests
                  </Link>
                </>
              )}
              {user.role === 'principal' && (
                <>
                  <Link
                    to="/principal/pending-requests"
                    className={`mobile-link ${isActive('/principal/pending-requests') ? 'active' : ''}`}
                    onClick={toggleMenu}
                  >
                    Pending Requests
                  </Link>
                  <Link
                    to="/principal/all-requests"
                    className={`mobile-link ${isActive('/principal/all-requests') ? 'active' : ''}`}
                    onClick={toggleMenu}
                  >
                    All Requests
                  </Link>
                </>
              )}
            </>
          )}
        </div>
        
        {user ? (
          <div className="mobile-user-section">
            <div className="mobile-user-info">
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-details">
                <div className="mobile-user-name">{user.name}</div>
                <div className="mobile-user-email">{user.email}</div>
              </div>
            </div>
            <button
              onClick={() => {
                handleLogout();
                toggleMenu();
              }}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="mobile-user-section">
            <Link
              to="/login"
              onClick={toggleMenu}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={toggleMenu}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 