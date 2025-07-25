import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './Auth.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotData, setForgotData] = useState({
    email: '',
    employeeId: '',
    newPassword: '',
    retypeNewPassword: ''
  });
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading: authLoading } = useAuth();
  
  // Check if already logged in and redirect
  useEffect(() => {
    if (user && !redirectAttempted && !authLoading) {
      console.log('User is authenticated, preparing to redirect:', user);
      setRedirectAttempted(true);
      
      // Check for a redirect path from session storage or location state
      const redirectPath = 
        sessionStorage.getItem('redirectPath') || 
        (location.state?.from?.pathname || 
        (user.role === 'faculty' ? '/apply' : '/pending-requests'));
      
      // Clear the redirect path
      sessionStorage.removeItem('redirectPath');
      
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectAttempted, authLoading, location]);

  useEffect(() => {
    if (forgotSuccess) {
      // Auto-redirect to login after 2 seconds
      const timer = setTimeout(() => {
        setShowForgot(false);
        setForgotSuccess('');
      }, 2000);
      setRedirectTimer(timer);
      return () => clearTimeout(timer);
    }
    // Cleanup timer if component unmounts
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [forgotSuccess]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation errors when field is edited
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Email validation for college domain with lastname.firstname format
    if (formData.email) {
      const emailRegex = /^[a-z]+\.[a-z]+@kbtcoe\.org$/i;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Email must be in format: lastname.firstname@kbtcoe.org";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      console.log('Attempting login with:', formData.email);
      const userData = await login(formData.email, formData.password);
      
      console.log('Login successful, user data:', userData);
      
      // Redirection will be handled by the useEffect above
      // Set some data to indicate a fresh login
      sessionStorage.setItem('freshLogin', 'true');
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  const handleForgotChange = (e) => {
    setForgotData({ ...forgotData, [e.target.name]: e.target.value });
    setForgotError('');
    setForgotSuccess('');
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!forgotData.email || !forgotData.employeeId || !forgotData.newPassword || !forgotData.retypeNewPassword) {
      setForgotError('All fields are required.');
      return;
    }
    if (forgotData.newPassword.length < 8) {
      setForgotError('Password should be at least 8 characters long.');
      return;
    }
    if (forgotData.newPassword !== forgotData.retypeNewPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: forgotData.email,
        employeeId: forgotData.employeeId,
        newPassword: forgotData.newPassword
      });
      setForgotSuccess(res.data.message || 'Password changed successfully.');
      setForgotData({ email: '', employeeId: '', newPassword: '', retypeNewPassword: '' });
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Determine button state based on local form submission only
  const isButtonDisabled = loading;
  const buttonText = loading ? 'Signing in...' : 'Sign In';

  return (
    <div className="auth-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="college-header" style={{ flex: '0 0 auto' }}>
        <img src="/logo.jpg" alt="College Logo" className="college-logo-Auth" />
        <div className="college-info">
          <h2>Maratha Vidya Prasarak Samaj's</h2>
          <h1>Karmaveer Adv. Baburao Ganpatrao Thakare College of Engineering</h1>
          <p>Udoji Maratha Boarding Campus, Near Pumping Station, Gangapur Road, Nashik</p>
          <p className="university-affiliation">An Autonomous Institute Permanently affiliated to Savitribai Phule Pune University</p>
        </div>
        <div className="college-accreditation">
          <img src="/naac.png" alt="NAAC A+" className="accreditation-logo" />
        </div>
      </div>
      
      <div className="auth-content" style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
        <div className="auth-form-container">
          <h2 className="gate-pass-title">Gate Pass for Faculty</h2>
          
          <div className="sign-in-container">
            <h3>{showForgot ? 'Forgot Password' : 'Sign In'}</h3>
            
            {showForgot ? (
              <form onSubmit={handleForgotSubmit}>
                <div className="form-group">
                  <label htmlFor="forgot-email">Email:</label>
                  <input type="email" id="forgot-email" name="email" value={forgotData.email} onChange={handleForgotChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="forgot-employeeId">Employee ID:</label>
                  <input type="text" id="forgot-employeeId" name="employeeId" value={forgotData.employeeId} onChange={handleForgotChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="forgot-newPassword">New Password:</label>
                  <input type="password" id="forgot-newPassword" name="newPassword" value={forgotData.newPassword} onChange={handleForgotChange} required minLength={8} />
                </div>
                <div className="form-group">
                  <label htmlFor="forgot-retypeNewPassword">Retype New Password:</label>
                  <input type="password" id="forgot-retypeNewPassword" name="retypeNewPassword" value={forgotData.retypeNewPassword} onChange={handleForgotChange} required minLength={8} />
                </div>
                {forgotError && <div className="auth-error">{forgotError}</div>}
                {forgotSuccess && (
                  <div className="auth-success" style={{ background: '#22c55e', color: 'white', padding: '0.75rem', borderRadius: '0.375rem', textAlign: 'center', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(34,197,94,0.08)' }}>
                    Password Changed Successfully !<br/>
                    Redirecting to login...
                  </div>
                )}
                <button type="submit" className="sign-in-btn" disabled={forgotLoading || !!forgotSuccess}>{forgotLoading ? 'Processing...' : 'Change Password'}</button>
                <div className="register-link" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                  <span
                    className="ig-link"
                    tabIndex={0}
                    role="button"
                    onClick={() => setShowForgot(false)}
                    onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') setShowForgot(false); }}
                    aria-disabled={!!forgotSuccess}
                  >
                    Back to login
                  </span>
                </div>
              </form>
            ) : (
              <>
                {error && <div className="auth-error">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`form-input ${validationErrors.email ? "input-error" : ""}`}
                      placeholder="lastname.firstname@kbtcoe.org" 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isButtonDisabled} 
                    className="sign-in-btn"
                  >
                    {buttonText}
                  </button>
                </form>
                
                <div className="register-link">
                  Don't have an account? <Link to="/register">Register</Link>
                </div>
                <div className="register-link" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                  <span
                    className="ig-link"
                    tabIndex={0}
                    role="button"
                    onClick={() => setShowForgot(true)}
                    onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') setShowForgot(true); }}
                  >
                    Forgot password?
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="college-building">
          <img src="/college-building.jpg" alt="College Building" style={{ maxWidth: '92%', height: 'auto', maxHeight: '1800px', objectFit: 'contain' }} />
        </div>
      </div>
      <footer style={{ backgroundColor: '#1e3a8a', color: 'white', textAlign: 'center', padding: '0.25rem 0.5rem', marginTop: 0, display: 'flex', justifyContent: 'center', alignItems:'center', gap:'6px', flex: '0 0 auto', fontSize: '0.85rem' }}>
        <p style={{ margin: 0 }}>&copy; 2025 KBTCOE. All rights reserved.</p>
        <Link to="/about" style={{ 
          marginTop: '0.1rem',
          padding: '0.2rem 0.5rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '0.3rem',
          textDecoration: 'none',
          fontWeight: '500',
          fontSize: '0.85rem'
        }}>
          About Us
        </Link>
      </footer>
    </div>
  );
}

export default Login; 