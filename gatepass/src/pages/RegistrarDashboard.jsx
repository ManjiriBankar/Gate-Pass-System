import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './PendingRequests.css';

const statusBadgeClass = (status) => {
  switch (status) {
    case 'approved':
    case 'registrar_approved':
      return 'request-status status-approved';
    case 'registrar_rejected':
    case 'rejected':
      return 'request-status status-rejected';
    case 'pending':
    case 'pending_emergency_allowed':
      return 'request-status status-pending';
    default:
      return 'request-status';
  }
};

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'HOD Approved' },
  { value: 'registrar_approved', label: 'Registrar Approved' },
  { value: 'registrar_rejected', label: 'Registrar Rejected' },
];

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

const RegistrarDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('approved');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/registrar/approved-requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch requests');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleAction = async (requestId, status) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/registrar/update-request', {
        requestId,
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(requests.map(r => r._id === requestId ? { ...r, status } : r));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update request');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter and sort requests so latest are at the top
  const filteredRequests = requests
    .filter(request => statusFilter === 'all' ? true : request.status === statusFilter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="pending-requests-container">
      <div className="requests-header">
        <h2 className="requests-title">
          Registrar Dashboard
          {filteredRequests.length > 0 && (
            <span className="requests-count">{filteredRequests.length}</span>
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
            {loading ? (
              <tr>
                <td colSpan="7">
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading requests...</p>
                  </div>
                </td>
              </tr>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map(request => (
                <tr key={request._id} className="request-row">
                  <td data-label="Faculty">
                    <div className="faculty-name">{request.facultyId?.name || (request.facultyId?.email?.split('@')[0] || 'Unknown')}</div>
                    <div className="faculty-email">{request.facultyId?.email || 'No email'}</div>
                    <div className="faculty-department">{request.facultyId?.department || 'No department'}</div>
                  </td>
                  <td data-label="Date" className="request-date">{new Date(request.date).toLocaleDateString()}</td>
                  <td data-label="Time">
                    <div className="request-time">Out: {request.timeOut}</div>
                    <div className="request-time">In: {request.timeIn}</div>
                  </td>
                  <td data-label="Purpose">
                    <span className={`request-purpose purpose-${(request.purpose || '').toLowerCase()}`}>{request.purpose}</span>
                  </td>
                  <td data-label="Reason">{request.reason}</td>
                  <td data-label="Status">
                    {request.status === 'pending_emergency_allowed' && request.statusDetail ? (
                      <span className={statusBadgeClass(request.status)}>
                        <span className="emergency-emoji">🚨</span>{request.statusDetail.replace('🚨', '').trim()}
                      </span>
                    ) : (
                      getCombinedStatusBadge(request)
                    )}
                  </td>
                  <td data-label="Actions" className="actions-cell">
                    {request.status === 'approved' && (
                      <div className="action-buttons">
                        <button
                          onClick={() => handleAction(request._id, 'registrar_approved')}
                          disabled={actionLoading}
                          className="approve-btn"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(request._id, 'registrar_rejected')}
                          disabled={actionLoading}
                          className="reject-btn"
                        >
                          Reject
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
                    <p className="no-requests-suggestion">There are no HOD-approved requests matching your filter criteria.</p>
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

export default RegistrarDashboard; 