import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ViewerRequests.css';

const ViewerPendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and has viewer role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    console.log("Current role from localStorage:", role);
    
    if (!token) {
      console.log("No token found, redirecting to login");
      navigate('/login');
      return;
    }
    
    if (role !== 'viewer') {
      console.log(`Role is ${role}, not viewer, redirecting to dashboard`);
      navigate('/dashboard');
      return;
    }
    
    fetchPendingRequests();
  }, [navigate]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching pending requests...");
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/viewer/pending-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Response received:", response.data);
      setRequests(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch pending requests');
      setLoading(false);
      toast.error("Failed to load pending requests. Please try again later.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleMarkAsAllowed = async (requestId) => {
    try {
      console.log("Marking request as allowed:", requestId);
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5000/api/viewer/mark-allowed/${requestId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update the local state to reflect the change
      setRequests(requests.filter(request => request._id !== requestId));
      toast.success('Request marked as allowed successfully');
    } catch (err) {
      console.error('Error marking request as allowed:', err);
      toast.error(err.response?.data?.message || 'Failed to mark request as allowed');
    }
  };

  // Safer filtering to handle potential null/undefined values
  const filteredRequests = requests.filter(request => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    const faculty = request.facultyId || {};
    const facultyName = faculty.name || '';
    const facultyEmail = faculty.email || request.facultyEmail || '';
    const facultyId = faculty.employeeId || '';
    const purpose = request.purpose || '';
    const reason = request.reason || '';
    const department = faculty.department || '';
    
    return (
      facultyName.toLowerCase().includes(searchTermLower) ||
      facultyEmail.toLowerCase().includes(searchTermLower) ||
      facultyId.toLowerCase().includes(searchTermLower) ||
      purpose.toLowerCase().includes(searchTermLower) ||
      reason.toLowerCase().includes(searchTermLower) ||
      department.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="viewer-requests-container">
      <div className="viewer-requests-header">
        <h1 className="viewer-requests-title">Pending Gate Pass Requests</h1>
        <p className="viewer-requests-subtitle">
          Pending requests are not available for viewers.
        </p>
      </div>
      <div className="no-requests">
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No pending requests available</h3>
          <p>Viewers cannot see pending requests.</p>
        </div>
      </div>
    </div>
  );
};

export default ViewerPendingRequests; 