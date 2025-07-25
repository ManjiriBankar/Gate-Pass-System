import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FacultyRequests.css';

const FacultyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [requestCounts, setRequestCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Check if user is logged in and is faculty
  useEffect(() => {
    // Get user information from AuthContext instead of localStorage
    const token = localStorage.getItem('token');
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('Checking authentication for FacultyRequests...');
    console.log('User data:', userFromStorage);
    
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Don't check role here - rely on the PrivateRoute component in App.jsx
    // that has already verified this is a faculty member
    
    console.log('User is authenticated, fetching requests');
    fetchRequests();
  }, [navigate]);
  
  // Fetch faculty's requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('Fetching requests for faculty...');
      console.log('User ID:', user._id);
      console.log('Token exists:', !!token);
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // First check if server is accessible
      try {
        console.log('Checking server status...');
        const statusCheck = await axios.get('http://localhost:5000/api/status');
        console.log('Server status:', statusCheck.data);
      } catch (err) {
        console.error('Server status check failed:', err);
        setError('Could not connect to server. Please check if the server is running.');
        setLoading(false);
        return;
      }
      
      // Now fetch faculty requests
      console.log('Fetching faculty requests from API...');
      const response = await axios.get('http://localhost:5000/api/faculty/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Response from API:', response.data);
      
      if (Array.isArray(response.data)) {
        const fetchedRequests = response.data;
        
        // Set requests data
        setRequests(fetchedRequests);
        
        // Calculate counts
        const counts = {
          total: fetchedRequests.length,
          pending: fetchedRequests.filter(r => r.status === 'pending').length,
          approved: fetchedRequests.filter(r => r.status === 'approved').length,
          rejected: fetchedRequests.filter(r => r.status === 'rejected').length
        };
        
        console.log('Request counts:', counts);
        setRequestCounts(counts);
        
        // Show message if no requests were found
        if (fetchedRequests.length === 0) {
          console.log('No requests found for this faculty member');
        }
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Received unexpected data format from server');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching requests:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      // Improved error handling with specific error messages
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access this page.');
      } else if (!err.response) {
        setError('Network error. Please check your internet connection and verify the server is running.');
      } else {
        setError(`Failed to fetch your requests: ${err.response?.data?.message || err.message}`);
      }
      
      setLoading(false);
    }
  };
  
  // Filter requests based on active tab
  const filteredRequests = requests
    .filter(request => {
      if (activeTab === 'all') return true;
      if (activeTab === 'approved') {
        return (request.statusDetail && request.statusDetail.toLowerCase().includes('approved')) || request.status === 'approved';
      }
      if (activeTab === 'rejected') {
        return (request.statusDetail && request.statusDetail.toLowerCase().includes('rejected')) || request.status === 'rejected';
      }
      return request.status === activeTab;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-badge status-pending';
      case 'pending_emergency_allowed': return 'status-badge status-pending-emergency-allowed';
      case 'approved': return 'status-badge status-approved';
      case 'rejected': return 'status-badge status-rejected';
      case 'registrar_approved': return 'status-badge status-registrar_approved';
      case 'registrar_rejected': return 'status-badge status-registrar_rejected';
      default: return 'status-badge';
    }
  };
  
  // Add this function near getStatusBadgeClass
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'pending_emergency_allowed': return 'Pending - Allowed For Emergency';
      case 'approved': return 'Approved by HOD';
      case 'rejected': return 'Rejected by HOD';
      case 'registrar_approved': return 'Approved by Registrar';
      case 'registrar_rejected': return 'Rejected by Registrar';
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
  };
  
  // Replace getCombinedStatusLabel with getCombinedStatusBadge from UpdateRequest.jsx
  const getCombinedStatusBadge = (request) => {
    let hod = request.hodStatus || 'pending';
    let registrar = request.registrarStatus || 'pending';
    let hodLabel =
      hod === 'approved' ? 'Approved by HOD' :
      hod === 'rejected' ? 'Rejected by HOD' :
      'Pending by HOD';
    let registrarLabel =
      registrar === 'approved' ? 'Approved by Registrar' :
      registrar === 'rejected' ? 'Rejected by Registrar' :
      'Pending by Registrar';
    let hodIcon =
      hod === 'approved' ? '✔️' :
      hod === 'rejected' ? '❌' :
      '⏳';
    let registrarIcon =
      registrar === 'approved' ? '✔️' :
      registrar === 'rejected' ? '❌' :
      '⏳';
    if (hod === 'rejected') {
      return (
        <div className="combined-status-badge">
          <span className={`combined-status-hod ${hod}`}> <span className="combined-status-icon">{hodIcon}</span> {hodLabel}</span>
        </div>
      );
    }
    if (hod === 'pending') {
      return (
        <div className="combined-status-badge">
          <span className={`combined-status-hod ${hod}`}> <span className="combined-status-icon">{hodIcon}</span> {hodLabel}</span>
        </div>
      );
    }
    return (
      <div className="combined-status-badge">
        <span className={`combined-status-hod ${hod}`}> <span className="combined-status-icon">{hodIcon}</span> {hodLabel}</span>
        <span className={`combined-status-registrar ${registrar}`}> <span className="combined-status-icon">{registrarIcon}</span> {registrarLabel}</span>
      </div>
    );
  };
  
  // Add a retry method
  const retryFetch = () => {
    setError('');
    setLoading(true);
    fetchRequests();
  };
  
  // Add a method to create a new request
  const goToCreateRequest = () => {
    navigate('/apply');
  };
  
  if (loading) {
    return (
      <div className="faculty-requests-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your requests...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="faculty-requests-container">
      <div className="faculty-requests-header">
        <h1 className="faculty-requests-title">My Gate Pass Requests</h1>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="close-btn">×</button>
          </div>
        )}
        
        <div className="view-toggle">
          <button 
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <span className="icon">📋</span> Table View
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            <span className="icon">🃏</span> Card View
          </button>
        </div>
      </div>
      
      <div className="tabs-container">
        <ul className="tabs">
          <li 
            className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({requestCounts.total})
          </li>
          <li 
            className={`tab-item ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </li>
          <li 
            className={`tab-item ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved
          </li>
          <li 
            className={`tab-item ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected
          </li>
        </ul>
      </div>
      
      <div className="content-container">
        {filteredRequests.length === 0 ? (
          <div className="no-requests">
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              {activeTab === 'all' ? (
                <>
                  <h3>You haven't made any gate pass requests yet</h3>
                  <p>To create a new gate pass request, click the button below.</p>
                </>
              ) : (
                <>
                  <h3>No {activeTab} requests found</h3>
                  <p>You don't have any {activeTab} gate pass requests.</p>
                </>
              )}
              <div className="empty-state-actions">
                {activeTab !== 'all' && (
                  <button 
                    onClick={() => setActiveTab('all')}
                    className="view-all-btn"
                  >
                    View All Requests
                  </button>
                )}
                <button 
                  onClick={retryFetch}
                  className="retry-btn"
                >
                  Refresh Data
                </button>
                <button 
                  onClick={goToCreateRequest}
                  className="create-request-btn"
                >
                  Submit New Request
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Table View */}
            {viewMode === 'table' && (
              <div className="requests-table-container">
                <table className="requests-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Purpose</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request._id} className={`request-row status-${request.status}-row`}>
                        <td>{request.date}</td>
                        <td>
                          <div>Out: {request.timeOut}</div>
                          <div>In: {request.timeIn}</div>
                        </td>
                        <td>
                          <span className={`purpose-badge purpose-${request.purpose.toLowerCase()}`}>
                            {request.purpose}
                          </span>
                        </td>
                        <td>{request.reason}</td>
                        <td>
                          {request.statusDetail === 'Pending By Principal' && request.status === 'pending' && (user.designation === 'HOD' || user.designation === 'Head Of The Department') ? (
                            <span className="status-badge status-pending-by-principal">
                              <span className="principal-emoji">⏳</span>{request.statusDetail}
                            </span>
                          ) : request.statusDetail === '✔️ Approved By Principal' ? (
                            <span className="status-badge status-approved-by-principal">
                              <span className="principal-emoji">✔️</span>Approved By Principal
                            </span>
                          ) : request.statusDetail === '❌ Rejected By Principal' ? (
                            <span className="status-badge status-rejected-by-principal">
                              <span className="principal-emoji">❌</span>Rejected By Principal
                            </span>
                          ) : request.statusDetail && request.status === 'pending' ? (
                            <span className={getStatusBadgeClass(request.status)}>
                              {request.statusDetail}
                            </span>
                          ) : request.status === 'pending_emergency_allowed' && request.statusDetail ? (
                            <span className={getStatusBadgeClass(request.status)}>
                              <span className="emergency-emoji">🚨</span>{request.statusDetail.replace('🚨', '').trim()}
                            </span>
                          ) : (
                            <div className="status-container">{getCombinedStatusBadge(request)}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Card View */}
            {viewMode === 'cards' && (
              <div className="request-cards">
                {filteredRequests.map((request) => (
                  <div key={request._id} className={`request-card ${request.status}-card`}>
                    <div className="request-card-header">
                      {/* Status at the top, using table view logic */}
                      {request.statusDetail === 'Pending By Principal' && request.status === 'pending' && (user.designation === 'HOD' || user.designation === 'Head Of The Department') ? (
                        <span className="status-badge status-pending-by-principal">
                          <span className="principal-emoji">⏳</span>{request.statusDetail}
                        </span>
                      ) : request.statusDetail === '✔️ Approved By Principal' ? (
                        <span className="status-badge status-approved-by-principal">
                          <span className="principal-emoji">✔️</span>Approved By Principal
                        </span>
                      ) : request.statusDetail === '❌ Rejected By Principal' ? (
                        <span className="status-badge status-rejected-by-principal">
                          <span className="principal-emoji">❌</span>Rejected By Principal
                        </span>
                      ) : request.statusDetail && request.status === 'pending' ? (
                        <span className={getStatusBadgeClass(request.status)}>
                          {request.statusDetail}
                        </span>
                      ) : request.status === 'pending_emergency_allowed' && request.statusDetail ? (
                        <span className={getStatusBadgeClass(request.status)}>
                          <span className="emergency-emoji">🚨</span>{request.statusDetail.replace('🚨', '').trim()}
                        </span>
                      ) : (
                        <div className="status-container">{getCombinedStatusBadge(request)}</div>
                      )}
                      <span className="request-id">ID: {request._id.substring(request._id.length - 6)}</span>
                    </div>
                    <div className="request-card-body">
                      <div className="info-group">
                        <div className="request-info-item">
                          <span className="info-label">Date</span>
                          <span className="info-value">{request.date}</span>
                        </div>
                        <div className="request-info-item">
                          <span className="info-label">Time Out</span>
                          <span className="info-value">{request.timeOut}</span>
                        </div>
                        <div className="request-info-item">
                          <span className="info-label">Time In</span>
                          <span className="info-value">{request.timeIn}</span>
                        </div>
                      </div>
                      <div className="request-info-item">
                        <span className="info-label">Purpose</span>
                        <span className={`purpose-badge purpose-${request.purpose.toLowerCase()}`}>{request.purpose}</span>
                      </div>
                      <div className="request-info-item">
                        <span className="info-label">Reason</span>
                        <span className="info-value reason-text">{request.reason}</span>
                      </div>
                      <div className="request-info-item request-id-item">
                        <span className="info-label">Request ID</span>
                        <span className="info-value request-id">{request._id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FacultyRequests; 