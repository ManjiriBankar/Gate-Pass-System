import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PendingRequests.css';

const PrincipalPendingRequests = () => {
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
    // Only allow principal
    if (user.role !== 'principal') {
      navigate('/');
      return;
    }
    fetchRequests();
  }, [user, navigate]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/principal/all-requests', {
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
    const prevRequests = [...requests];
    setRequests(requests.filter(request => request._id !== requestId));
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/principal/update-request', 
      { requestId, status }, 
      { headers: { Authorization: `Bearer ${token}` } });
      setStatusFilter('pending');
    } catch (err) {
      setRequests(prevRequests);
      setError('Failed to update request. Please try again.');
      console.error(`Error ${status} request:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'approved') {
      return request.status === 'approved' || request.status === 'registrar_approved';
    }
    if (statusFilter === 'rejected') {
      return request.status === 'rejected' || request.status === 'registrar_rejected';
    }
    if (statusFilter === 'pending') {
      return request.status === 'pending' || request.status === 'pending_emergency_allowed';
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
          HOD Gate Pass Requests
          {getDisplayedCount() > 0 && (
            <span className="requests-count">{getDisplayedCount()}</span>
          )}
        </h2>
      </div>
      {error && (
        <div className="alert alert-danger" role="alert">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">&times;</button>
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
              filteredRequests.map((request) => {
                console.log('Request row:', request._id, 'status:', request.status, 'statusDetail:', request.statusDetail);
                return (
                  <tr key={request._id} className="request-row">
                    <td data-label="Faculty">
                      <div className="faculty-name">{request.facultyId?.name || request.facultyEmail.split('@')[0]}</div>
                      <div className="faculty-email">{request.facultyEmail}</div>
                      <div className="faculty-department">{request.facultyId?.department || 'No department'}</div>
                    </td>
                    <td data-label="Date" className="request-date">{request.date}</td>
                    <td data-label="Time">
                      <div className="request-time">Out: {request.timeOut}</div>
                      <div className="request-time">In: {request.timeIn}</div>
                    </td>
                    <td data-label="Purpose">
                      <span className={`request-purpose purpose-${request.purpose.toLowerCase()}`}>{request.purpose}</span>
                    </td>
                    <td data-label="Reason">{request.reason}</td>
                    <td data-label="Status">
                      {request.statusDetail === 'Pending By Principal' && request.status === 'pending' ? (
                        <span className="status-badge status-pending-by-principal">
                          <span className="principal-emoji">⏳</span>{request.statusDetail}
                        </span>
                      ) : (
                        <span className={`request-status ${
                          (request.statusDetail && request.statusDetail.toLowerCase().includes('approved')) ||
                          request.status === 'approved' || request.status === 'registrar_approved'
                            ? 'status-approved'
                            : (request.statusDetail && request.statusDetail.toLowerCase().includes('rejected')) ||
                              request.status === 'rejected' || request.status === 'registrar_rejected'
                            ? 'status-rejected'
                            : `status-${request.status}`
                        }`}>
                          {request.statusDetail || (request.status.charAt(0).toUpperCase() + request.status.slice(1))}
                        </span>
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
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
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

export default PrincipalPendingRequests; 