import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PendingRequests.css';

const PendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchRequests();
  }, [user, navigate]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/all-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data.requests || []);
      setCounts(response.data.counts || { all: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    setActionLoading(true);
    // Optimistically update UI
    const prevRequests = [...requests];
    setRequests(requests.filter(request => request._id !== requestId));
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/update-request', 
      { 
        requestId, 
        status 
      }, 
      {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Optionally re-fetch in background for consistency
      // await fetchRequests();
      setStatusFilter('pending');
      console.log('Optimistically removed request, backend updated');
    } catch (err) {
      // If backend fails, revert UI and show error
      setRequests(prevRequests);
      setError('Failed to update request. Please try again.');
      console.error(`Error ${status} request:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter requests based on status
  const filteredRequests = requests.filter(request => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'approved') {
      return request.status === 'approved' || request.status === 'registrar_approved';
    }
    if (statusFilter === 'rejected') {
      return request.status === 'rejected' || request.status === 'registrar_rejected';
    }
    return request.status === statusFilter;
  });

  const getDisplayedCount = () => {
    switch(statusFilter) {
      case 'all': return counts.all;
      case 'pending': return counts.pending;
      case 'approved': return counts.approved;
      case 'rejected': return counts.rejected;
      default: return 0;
    }
  }

  // Add getCombinedStatusBadge and getStatusBadgeClass from UpdateRequest.jsx for consistent status rendering
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading requests...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pending-requests-container">
        <div className="no-requests">
          <div className="no-requests-icon">⚠️</div>
          <div className="no-requests-message">Authentication Required</div>
          <p className="no-requests-suggestion">Please login to view pending requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-requests-container">
      <div className="requests-header">
        <h2 className="requests-title">
          Gate Pass Requests
          {getDisplayedCount() > 0 && (
            <span className="requests-count">{getDisplayedCount()}</span>
          )}
        </h2>
        {/* <div className="department-info">
          Department: <span className="department-name">{user.department}</span>
          <p className="department-note">You are viewing requests from faculty in your department only.</p>
        </div> */}
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            className="ml-auto"
          >
            &times;
          </button>
        </div>
      )}
      
      <div className="requests-table-container">
        <table className="requests-table">
          <thead>
            <tr>
              <th>Faculty</th>
              <th>Date</th>
              <th>Time</th>
              <th>Purpose</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <tr key={request._id} className="request-row">
                  <td data-label="Faculty">
                    <div className="faculty-name">{request.facultyId?.name || request.facultyEmail.split('@')[0]}</div>
                    <div className="faculty-email">{request.facultyEmail}</div>
                  </td>
                  <td data-label="Date" className="request-date">
                    {request.date}
                  </td>
                  <td data-label="Time">
                    <div className="request-time">Out: {request.timeOut}</div>
                    <div className="request-time">In: {request.timeIn}</div>
                  </td>
                  <td data-label="Purpose">
                    <span className={`request-purpose purpose-${request.purpose.toLowerCase()}`}>
                      {request.purpose}
                    </span>
                  </td>
                  <td data-label="Reason">
                    {request.reason}
                  </td>
                  <td data-label="Status">
                    {request.status === 'pending_emergency_allowed' && request.statusDetail ? (
                      <span className={getStatusBadgeClass(request.status)}>{request.statusDetail}</span>
                    ) : (
                      <div className="status-container">{getCombinedStatusBadge(request)}</div>
                    )}
                  </td>
                  <td data-label="Actions" className="actions-cell">
                    {request.status === 'pending' && (
                      <div className="action-buttons">
                        <button
                          onClick={() => handleUpdateStatus(request._id, 'approved')}
                          disabled={actionLoading}
                          className="approve-btn"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(request._id, 'rejected')}
                          disabled={actionLoading}
                          className="reject-btn"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(request._id, 'pending_emergency_allowed')}
                          disabled={actionLoading}
                          className="emergency-btn"
                        >
                          Emergency Approval
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center">
                  <div className="no-requests">
                    <div className="no-requests-icon">📝</div>
                    <div className="no-requests-message">No requests found</div>
                    <p className="no-requests-suggestion">There are no gate pass requests from your department matching your filter criteria.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingRequests; 