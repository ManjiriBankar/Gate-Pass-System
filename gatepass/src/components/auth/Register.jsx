import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'faculty',
    employeeId: '',
    designation: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If role is being changed to 'admin', set designation to 'HOD'
    if (name === 'role' && value === 'admin') {
      setFormData({
        ...formData,
        [name]: value,
        designation: 'HOD'
      });
    } else if (name === 'role' && value === 'viewer') {
      // Clear fields not needed for viewer role
      setFormData({
        ...formData,
        [name]: value,
        employeeId: '',
        designation: '',
        department: ''
      });
    } else if (name === 'role' && value === 'registrar') {
      setFormData({
        ...formData,
        [name]: value,
        employeeId: '',
        designation: '',
        department: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
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
    
    // Password strength validation
    if (formData.password && formData.password.length < 8) {
      errors.password = "Password should be at least 8 characters long";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await axios.post('http://localhost:5000/api/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="college-header">
        <img src="/logo.jpg" alt="College Logo" className="college-logo-Auth" />
        <div className="college-info">
          <h2>Maratha Vidya Prasarak Samaj's</h2>
          <h1>Karmaveer Adv. Baburao Ganpatrao Thakare College of Engineering</h1>
          <p>Udoji Maratha Boarding Campus, Near Pumping Station, Gangapur Road, Nashik</p>
          <p className="register-affiliation">An Autonomous Institute Permanently affiliated to Savitribai Phule Pune University</p>
        </div>
        <div className="college-accreditation">
          <img src="/naac.png" alt="NAAC A+" className="accreditation-logo" />
        </div>
      </div>
      
      <div className="register-content">
        <div className="register-form-container">
          <h2>Register</h2>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={validationErrors.email ? "input-error" : ""}
                  placeholder="lastname.firstname@kbtcoe.org"
                />
                {/* {validationErrors.email && <div className="error-message">{validationErrors.email}</div>}
                {!validationErrors.email && <div className="helper-text">Format: lastname.firstname@kbtcoe.org</div>} */}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className={validationErrors.password ? "input-error" : ""}
                />
                {validationErrors.password && <div className="error-message">{validationErrors.password}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="role">Role:</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                  <option value="registrar">Registrar</option>
                  <option value="principal">Principal</option>
                </select>
              </div>
            </div>
            
            {formData.role !== 'viewer' && formData.role !== 'registrar' && formData.role !== 'principal' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="employeeId">Employee ID:</label>
                    <input
                      type="text"
                      id="employeeId"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      required={formData.role !== 'viewer'}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="designation">Designation:</label>
                    <select
                      id="designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      required={formData.role !== 'viewer'}
                      disabled={formData.role === 'admin'}
                    >
                      <option value="">Select Designation</option>
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lab Assistant">Lab Assistant</option>
                      <option value="Lab Technician">Lab Technician</option>
                      <option value="Teaching Assistant">Teaching Assistant</option>
                      <option value="Guest Faculty">Guest Faculty</option>
                      <option value="Adjunct Faculty">Adjunct Faculty</option>
                    </select>
                    {formData.role === 'admin' && <div className="info-message">Admin role is set as HOD by default</div>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="department">Department:</label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required={formData.role !== 'viewer'}
                    >
                      <option value="">Select Department</option>
                      <option value="Computer">Computer Engineering</option>
                      <option value="IT">Information Technology</option>
                      <option value="Mechanical">Mechanical Engineering</option>
                      <option value="ENTC">Electronics & Telecommunication</option>
                      <option value="Electrical">Electrical Engineering</option>
                      <option value="AIDS">AI & Data Science</option>
                      <option value="Civil">Civil Engineering</option>
                      <option value="Instrumentation">Instrumentation Engineering</option>
                      <option value="Automation and Robotics">Automation and Robotics</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            
            <div className="form-submit">
              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
            
            <div className="login-link">
              Already have an account? <Link to="/login">Sign In</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register; 