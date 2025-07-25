import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ViewerRequests.css';

const ViewerAllRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tokenDebug, setTokenDebug] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and has viewer role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    console.log("Current role from localStorage:", role);
    setTokenDebug(token ? "Token exists with length " + token.length : "No token");
    
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
    
    fetchAllRequests();
  }, [navigate]);

  const fetchAllRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching all requests...");
      const token = localStorage.getItem('token');
      console.log("Using token:", token ? "Token exists with length " + token.length : "No token");
      
      // Try to use the Authorization header format
      const response = await axios.get('http://localhost:5000/api/viewer/all-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Raw API response status:", response.status);
      console.log("Raw API response data length:", response.data.length);
      
      // Sample the first item if available for debugging
      if (response.data.length > 0) {
        console.log("Sample response item:", {
          id: response.data[0]._id,
          status: response.data[0].status,
          facultyEmail: response.data[0].facultyEmail
        });
      }
      
      // Sort requests by date (most recent first)
      const sortedRequests = [...response.data].sort((a, b) => {
        // Convert strings to dates and compare
        return new Date(b.date) - new Date(a.date);
      });
      
      // Don't filter in the frontend - trust backend filtering
      setRequests(sortedRequests);
      
      if (response.data.length === 0) {
        console.log("No requests returned from API - this could be normal if no approved/rejected requests exist");
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching all requests:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to fetch requests');
      setLoading(false);
      toast.error("Failed to load requests. Please try again later.");
    }
  };

  const handleMarkAsAllowed = async (requestId) => {
    try {
      setActionLoading(true);
      console.log("Marking request as allowed:", requestId);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`http://localhost:5000/api/viewer/mark-allowed/${requestId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Mark as allowed response:", response.data);
      
      // Update the local state to reflect the change
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === requestId 
            ? { ...req, allowed: true, allowedAt: new Date() } 
            : req
        )
      );
      toast.success('Request marked as allowed successfully');
    } catch (err) {
      console.error('Error marking request as allowed:', err);
      console.error('Error details:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to mark request as allowed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsReturned = async (requestId) => {
    try {
      setActionLoading(true);
      console.log("Marking request as returned:", requestId);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`http://localhost:5000/api/viewer/mark-returned/${requestId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Mark as returned response:", response.data);
      
      // Update the local state to reflect the change
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === requestId 
            ? { ...req, returned: true, returnedAt: new Date() } 
            : req
        )
      );
      toast.success('Request marked as returned successfully');
    } catch (err) {
      console.error('Error marking request as returned:', err);
      console.error('Error details:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to mark request as returned');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAllowForEmergency = async (requestId) => {
    try {
      setActionLoading(true);
      console.log("Allowing request for emergency:", requestId);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`http://localhost:5000/api/viewer/mark-allowed/${requestId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Allow for emergency response:", response.data);
      
      // Update the local state to reflect the change
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === requestId 
            ? { ...req, allowed: true, allowedAt: new Date(), status: 'pending_emergency_allowed', statusDetail: 'Pending - Allowed For Emergency' } 
            : req
        )
      );
      toast.success('Request allowed for emergency successfully');
    } catch (err) {
      console.error('Error allowing request for emergency:', err);
      console.error('Error details:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to allow request for emergency');
    } finally {
      setActionLoading(false);
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

  // Safer filtering to handle potential null/undefined values
  const filteredRequests = requests.filter(request => {
    // Show if status is allowed OR statusDetail is principal approved/rejected
    const allowedStatuses = [
      'registrar_approved',
      'pending_emergency_allowed',
      'rejected',
      'registrar_rejected'
    ];
    const isPrincipalStatus = request.statusDetail === '✔️ Approved By Principal' || request.statusDetail === '❌ Rejected By Principal';
    if (!allowedStatuses.includes(request.status) && !isPrincipalStatus) return false;
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // Access faculty info from direct properties since that's how data is stored
    const facultyName = request.facultyId?.name || (request.facultyEmail?.split('@')[0]) || 'Unknown';
    const facultyEmail = request.facultyEmail || 'No email';
    const purpose = request.purpose || '';
    const reason = request.reason || '';
    const status = request.status || '';
    const facultyDepartment = request.facultyId?.department || 'No department';
    
    return (
      facultyName.toLowerCase().includes(searchTermLower) ||
      facultyEmail.toLowerCase().includes(searchTermLower) ||
      purpose.toLowerCase().includes(searchTermLower) ||
      reason.toLowerCase().includes(searchTermLower) ||
      status.toLowerCase().includes(searchTermLower) ||
      facultyDepartment.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="viewer-requests-container">
      <div className="viewer-requests-header">
        <h1 className="viewer-requests-title">All Gate Pass Requests</h1>
        <p className="viewer-requests-subtitle">
          View and manage all gate pass requests with different status types
        </p>
      </div>

      <div className="actions-bar">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, department, purpose, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>
        <div className="buttons-container">
          <button
            className="refresh-btn"
            onClick={fetchAllRequests}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            className="view-allowed-btn"
            onClick={() => navigate('/viewer/allowed-requests')}
          >
            View Allowed Requests
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button className="close-btn" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
      
      {tokenDebug && (
        <div className="debug-info" style={{background: "#f8f9fa", padding: "5px 10px", margin: "10px 0", borderRadius: "4px", fontSize: "0.8rem", color: "#666"}}>
          Auth: {tokenDebug}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="no-requests">
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No requests found</h3>
            <p>
              {searchTerm
                ? "No requests match your search criteria"
                : "There are no gate pass requests in the system yet."}
            </p>
            <button
              className="view-allowed-btn"
              onClick={fetchAllRequests}
              style={{ marginTop: '15px' }}
            >
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Faculty</th>
                <th>Request Details</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => {
                // Get faculty info directly from the request
                const facultyName = request.facultyId?.name || (request.facultyEmail?.split('@')[0]) || 'Unknown';
                const facultyEmail = request.facultyEmail || 'No email';
                const facultyDepartment = request.facultyId?.department || 'No department';
                
                return (
                  <tr
                    key={request._id}
                    className={`request-row ${
                      request.allowed
                        ? "status-allowed-row"
                        : request.status === "approved"
                        ? "status-approved-row"
                        : request.status === "rejected"
                        ? "status-rejected-row"
                        : "status-pending-row"
                    }`}
                  >
                    <td data-label="Faculty">
                      <div className="faculty-name">{facultyName}</div>
                      <div className="faculty-email">{facultyEmail}</div>
                      <div className="faculty-department">{facultyDepartment}</div>
                    </td>
                    <td data-label="Request Details">
                      <div className="request-time">
                        Requested on: {formatDate(request.createdAt)}
                      </div>
                      <div className="request-time">
                        Date: {request.date || 'N/A'}
                      </div>
                      <div className="request-time">
                        Time: {request.timeOut || 'N/A'} - {request.timeIn || 'N/A'}
                      </div>
                      <div
                        className={`purpose-badge purpose-${(request.purpose || '').toLowerCase()}`}
                      >
                        {request.purpose || 'Unknown'}
                      </div>
                      <div className="request-reason">{request.reason || 'No reason provided'}</div>
                    </td>
                    <td data-label="Status">
                      {request.status === 'pending_emergency_allowed' && request.statusDetail ? (
                        <span className={`status-badge status-${request.status}`}>
                          <span className="emergency-emoji">🚨</span>{request.statusDetail.replace('🚨', '').trim()}
                        </span>
                      ) : request.statusDetail === '✔️ Approved By Principal' ? (
                        <span className="status-badge status-approved-by-principal">
                          <span className="principal-emoji">✔️</span>Approved By Principal
                        </span>
                      ) : request.statusDetail === '❌ Rejected By Principal' ? (
                        <span className="status-badge status-rejected-by-principal">
                          <span className="principal-emoji">❌</span>Rejected By Principal
                        </span>
                      ) : (
                        <div className="status-container">{getCombinedStatusBadge(request)}</div>
                      )}
                    </td>
                    <td data-label="Action">
                      {request.status === 'pending' && !request.allowed && (
                        <button
                          onClick={() => handleAllowForEmergency(request._id)}
                          className="emergency-allow-btn"
                          disabled={actionLoading}
                        >
                          Allow For Emergency
                        </button>
                      )}
                      
                      {(request.status === 'pending_emergency_allowed' || request.statusDetail === '✔️ Approved By Principal') && !request.allowed && (
                        <div className="action-buttons">
                          <button
                            onClick={() => handleMarkAsAllowed(request._id)}
                            className="allow-btn"
                            disabled={actionLoading}
                          >
                            Mark As Allowed
                          </button>
                          <button
                            className="return-btn"
                            disabled={true}
                          >
                            Mark As Returned
                          </button>
                        </div>
                      )}
                      
                      {(request.status === 'pending_emergency_allowed' || request.statusDetail === '✔️ Approved By Principal') && request.allowed && !request.returned && (
                        <div className="action-buttons">
                          <div className="allowed-status">
                            <div className="allowed-badge">
                              Allowed ✓
                            </div>
                            <div className="allowed-time">
                              Allowed at: {formatDate(request.allowedAt)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleMarkAsReturned(request._id)}
                            className="return-btn"
                            disabled={actionLoading}
                          >
                            Mark As Returned
                          </button>
                        </div>
                      )}
                      
                      {(request.status === 'pending_emergency_allowed' || request.statusDetail === '✔️ Approved By Principal') && request.allowed && request.returned && (
                        <div className="action-buttons">
                          <div className="allowed-status">
                            <div className="allowed-badge">
                              Allowed ✓
                            </div>
                            <div className="allowed-time">
                              Allowed at: {formatDate(request.allowedAt)}
                            </div>
                          </div>
                          <div className="returned-status">
                            <div className="returned-badge">
                              Returned ✓
                            </div>
                            <div className="returned-time">
                              Returned at: {formatDate(request.returnedAt)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(request.status === 'rejected' || request.status === 'registrar_rejected') && (
                        <button
                          className="not-allowed-btn"
                          disabled={true}
                        >
                          Not Allowed
                        </button>
                      )}
                      
                      {request.status === 'registrar_approved' && !request.allowed && (
                        <div className="action-buttons">
                          <button
                            onClick={() => handleMarkAsAllowed(request._id)}
                            className="allow-btn"
                            disabled={actionLoading}
                          >
                            Mark As Allowed
                          </button>
                          <button
                            className="return-btn"
                            disabled={true}
                          >
                            Mark As Returned
                          </button>
                        </div>
                      )}
                      
                      {request.status === 'registrar_approved' && request.allowed && !request.returned && (
                        <div className="action-buttons">
                          <div className="allowed-status">
                            <div className="allowed-badge">
                              Allowed ✓
                            </div>
                            <div className="allowed-time">
                              Allowed at: {formatDate(request.allowedAt)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleMarkAsReturned(request._id)}
                            className="return-btn"
                            disabled={actionLoading}
                          >
                            Mark As Returned
                          </button>
                        </div>
                      )}
                      
                      {request.status === 'registrar_approved' && request.allowed && request.returned && (
                        <div className="action-buttons">
                          <div className="allowed-status">
                            <div className="allowed-badge">
                              Allowed ✓
                            </div>
                            <div className="allowed-time">
                              Allowed at: {formatDate(request.allowedAt)}
                            </div>
                          </div>
                          <div className="returned-status">
                            <div className="returned-badge">
                              Returned ✓
                            </div>
                            <div className="returned-time">
                              Returned at: {formatDate(request.returnedAt)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {request.status === 'approved' && request.allowed && !request.returned && !request.statusDetail && (
                        <div className="action-buttons">
                        <div className="allowed-status">
                          <div className="allowed-badge">
                            Allowed ✓
                          </div>
                          <div className="allowed-time">
                              Allowed at: {formatDate(request.allowedAt)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleMarkAsReturned(request._id)}
                            className="return-btn"
                            disabled={actionLoading}
                          >
                            Mark As Returned
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewerAllRequests; 