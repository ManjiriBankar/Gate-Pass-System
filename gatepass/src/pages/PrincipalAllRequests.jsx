import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UpdateRequest.css';

const PrincipalAllRequests = () => {
  const [requests, setRequests] = useState([]);
  const [requestCounts, setRequestCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({ date: '', facultyName: '' });
  const [uniqueFaculty, setUniqueFaculty] = useState([]);
  const [serverStatus, setServerStatus] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');

  const checkServerStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/status');
      setServerStatus(response.data);
      return response.data;
    } catch (err) {
      setServerStatus({ server: 'offline', error: err.message });
      setError('Cannot connect to server. Please make sure the backend server is running.');
      return null;
    }
  };

  const fetchRequests = async (filterParams = {}) => {
    try {
      const status = await checkServerStatus();
      if (!status || status.server !== 'running' || status.mongodb !== 'connected') {
        if (status && status.mongodb !== 'connected') {
          setError('Database connection issue. Please contact administrator.');
        }
        return;
      }
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (filterParams.status && filterParams.status !== 'all') {
        queryParams.append('status', filterParams.status);
      }
      if (filterParams.date) {
        queryParams.append('date', filterParams.date);
      }
      if (filterParams.facultyName) {
        queryParams.append('facultyName', filterParams.facultyName);
      }
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get(`http://localhost:5000/api/principal/all-requests${queryString}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data.requests);
      setRequestCounts(response.data.counts);
      setDepartment(response.data.department);
      const facultyNames = [...new Set(response.data.requests.map(req => req.facultyId?.name || req.facultyEmail.split('@')[0]))];
      setUniqueFaculty(facultyNames);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || !err.response) {
        setError('Cannot connect to server. Please make sure the backend server is running.');
      } else if (err.response?.status === 401) {
        setError('Authentication error. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access this resource.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch requests. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (user.role !== 'principal') {
      navigate('/');
      return;
    }
    const init = async () => {
      const status = await checkServerStatus();
      if (status && status.server === 'running' && status.mongodb === 'connected') {
        fetchRequests();
      } else {
        setLoading(false);
      }
    };
    init();
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'principal') {
      const tabStatus = activeTab === 'all' ? null : activeTab;
      setFilters({ date: '', facultyName: '' });
      if (activeTab === 'approved' || activeTab === 'rejected') {
        if (activeTab === 'approved') {
          handleApprovedTabClick();
        } else {
          handleRejectedTabClick();
        }
      } else {
        fetchRequests({ status: tabStatus });
      }
    }
  }, [activeTab]);

  const getDisplayedCount = () => {
    switch(activeTab) {
      case 'all': return requestCounts.all;
      case 'pending': return requestCounts.pending;
      case 'approved': return requestCounts.approved;
      case 'rejected': return requestCounts.rejected;
      default: return 0;
    }
  };

  const handleApprovedTabClick = () => {
    setActiveTab('approved');
    setLoading(true);
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/principal/all-requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      const approvedRequests = response.data.requests.filter(req => 
        req.status === 'approved' || 
        req.status === 'registrar_approved' ||
        (req.statusDetail && req.statusDetail.toLowerCase().includes('approved'))
      );
      setRequests(approvedRequests);
      const newCounts = {
        ...response.data.counts,
        approved: approvedRequests.length
      };
      setRequestCounts(newCounts);
      if (approvedRequests.length > 0) {
        setSuccessMessage(`Successfully loaded ${approvedRequests.length} approved requests.`);
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setSuccessMessage('No approved requests found.');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
      setLoading(false);
    })
    .catch(err => {
      setError("Failed to load approved requests. See console for details.");
      setLoading(false);
    });
  };

  const handleRejectedTabClick = () => {
    setActiveTab('rejected');
    setLoading(true);
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/principal/all-requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      const rejectedRequests = response.data.requests.filter(req => 
        req.status === 'rejected' || 
        req.status === 'registrar_rejected' ||
        (req.statusDetail && req.statusDetail.toLowerCase().includes('rejected'))
      );
      setRequests(rejectedRequests);
      const newCounts = {
        ...response.data.counts,
        rejected: rejectedRequests.length
      };
      setRequestCounts(newCounts);
      if (rejectedRequests.length > 0) {
        setSuccessMessage(`Successfully loaded ${rejectedRequests.length} rejected requests.`);
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setSuccessMessage('No rejected requests found.');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
      setLoading(false);
    })
    .catch(err => {
      setError("Failed to load rejected requests. See console for details.");
      setLoading(false);
    });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    fetchRequests({ ...filters, status: activeTab });
  };

  const clearFilters = () => {
    setFilters({ date: '', facultyName: '' });
    fetchRequests();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

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

  const handleUpdateStatus = async (requestId, status) => {
    setActionLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:5000/api/principal/update-request',
        { requestId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage(`Request status updated successfully.`);
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      fetchRequests();
    } catch (err) {
      setError("Failed to update request status. See console for details.");
    } finally {
      setActionLoading(false);
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
      <div className="update-requests-container">
        <div className="no-requests">
          <div className="no-requests-icon">⚠️</div>
          <div className="no-requests-message">Authentication Required</div>
          <p className="no-requests-suggestion">Please login to view and update requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="update-requests-container">
      <div className="update-requests-header">
        <h2 className="update-requests-title">
          All Gate Pass Requests
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
      <div className="tabs-container">
        <ul className="tabs">
          <li className={`tab-item${activeTab === 'all' ? ' active' : ''}`} onClick={() => setActiveTab('all')}>All</li>
          <li className={`tab-item${activeTab === 'pending' ? ' active' : ''}`} onClick={() => setActiveTab('pending')}>Pending</li>
          <li className={`tab-item${activeTab === 'approved' ? ' active' : ''}`} onClick={() => setActiveTab('approved')}>Approved</li>
          <li className={`tab-item${activeTab === 'rejected' ? ' active' : ''}`} onClick={() => setActiveTab('rejected')}>Rejected</li>
        </ul>
      </div>
      <div className="filters-container">
        <h3 className="filters-title">Filter Requests</h3>
        <div className="filters-form">
          <div className="filter-group">
            <label htmlFor="date">Date (Exact Match):</label>
            <input
              type="date"
              id="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className={`filter-input ${filters.date ? 'active-filter' : ''}`}
            />
            {filters.date && (
              <small className="filter-hint">Showing only requests with exact date match</small>
            )}
          </div>
          <div className="filter-group">
            <label htmlFor="facultyName">Faculty:</label>
            <input
              type="text"
              id="facultyName"
              name="facultyName"
              value={filters.facultyName}
              onChange={handleFilterChange}
              placeholder="Search by name or email"
              className={`filter-input ${filters.facultyName ? 'active-filter' : ''}`}
            />
          </div>
          <button onClick={applyFilters} className="apply-filters-btn">Apply Filters</button>
          <button onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>
        </div>
      </div>
      {successMessage && (
        <div className="alert alert-success" role="alert">
          <span>{successMessage}</span>
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
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              (activeTab === 'pending'
                ? requests.filter(request => request.status === 'pending')
                : requests
              ).map((request) => (
                <tr key={request._id} className={`request-row status-${request.status}-row`}>
                  <td>
                    <div className="faculty-name">{request.facultyId?.name || request.facultyEmail.split('@')[0]}</div>
                    <div className="faculty-email">{request.facultyEmail}</div>
                    <div className="faculty-department">{request.facultyId?.department || 'No department'}</div>
                  </td>
                  <td>
                    <div className="request-date">{formatDate(request.date)}</div>
                  </td>
                  <td>
                    <div className="request-time">
                      <div>Out: {request.timeOut}</div>
                      <div>In: {request.timeIn || 'N/A'}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`purpose-badge purpose-${request.purpose.toLowerCase()}`}>{request.purpose}</span>
                  </td>
                  <td>{request.reason}</td>
                  <td>
                    {request.statusDetail === 'Pending By Principal' && request.status === 'pending' ? (
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
                    ) : request.status === 'pending_emergency_allowed' && request.statusDetail ? (
                      <span className={getStatusBadgeClass(request.status)}>{request.statusDetail}</span>
                    ) : (
                      <div className="status-container">{getCombinedStatusBadge(request)}</div>
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

export default PrincipalAllRequests; 