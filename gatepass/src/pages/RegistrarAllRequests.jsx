import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PendingRequests.css';

const RegistrarAllRequests = () => {
  const [requests, setRequests] = useState([]);
  const [requestCounts, setRequestCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ date: '', facultyName: '' });
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) {
      navigate('/login');
      return;
    }
    if (role !== 'registrar') {
      navigate('/dashboard');
      return;
    }
    fetchRegistrarRequests({ status: activeTab });
  }, [navigate, activeTab]);

  const fetchRegistrarRequests = async (filterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      let queryParams = [];
      if (filterParams.status && filterParams.status !== 'all') queryParams.push(`status=${filterParams.status}`);
      if (filterParams.date) queryParams.push(`date=${filterParams.date}`);
      if (filterParams.facultyName) queryParams.push(`facultyName=${filterParams.facultyName}`);
      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
      const response = await axios.get(`http://localhost:5000/api/registrar/all-requests${queryString}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRequests(response.data.requests || response.data);
      setRequestCounts(response.data.counts || {
        total: response.data.requests?.length || response.data.length || 0,
        pending: (response.data.requests || response.data).filter(r => r.status === 'pending').length,
        approved: (response.data.requests || response.data).filter(r => r.status === 'registrar_approved').length,
        rejected: (response.data.requests || response.data).filter(r => r.status === 'registrar_rejected').length
      });
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch requests');
      setLoading(false);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setFilters({ date: '', facultyName: '' });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => {
    fetchRegistrarRequests({ ...filters, status: activeTab });
  };

  const clearFilters = () => {
    setFilters({ date: '', facultyName: '' });
    fetchRegistrarRequests({ status: activeTab });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Filter and sort requests so latest are at the top
  const filteredRequests = requests
    .filter(request => {
      // Pending tab: only show status === 'approved'
      if (activeTab === 'pending' && request.status !== 'approved') return false;
      // Date filter
      if (filters.date && request.date !== filters.date) return false;
      // Faculty filter
      if (filters.facultyName) {
        const facultyName = request.facultyId?.name?.toLowerCase() || '';
        const facultyEmail = request.facultyId?.email?.toLowerCase() || '';
        if (!facultyName.includes(filters.facultyName.toLowerCase()) && !facultyEmail.includes(filters.facultyName.toLowerCase())) return false;
      }
      // Search term
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        const facultyName = request.facultyId?.name || '';
        const facultyEmail = request.facultyId?.email || '';
        const purpose = request.purpose || '';
        const reason = request.reason || '';
        const status = request.status || '';
        if (!(
          facultyName.toLowerCase().includes(searchTermLower) ||
          facultyEmail.toLowerCase().includes(searchTermLower) ||
          purpose.toLowerCase().includes(searchTermLower) ||
          reason.toLowerCase().includes(searchTermLower) ||
          status.toLowerCase().includes(searchTermLower) ||
          (request.facultyId?.department && request.facultyId.department.toLowerCase().includes(searchTermLower))
        )) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Status badge class for highlighting
  const statusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
      case 'registrar_approved':
        return 'status-badge status-approved';
      case 'registrar_rejected':
      case 'rejected':
        return 'status-badge status-rejected';
      case 'pending':
        return 'status-badge status-pending';
      case 'pending_emergency_allowed':
        return 'status-badge status-pending-emergency-allowed';
      default:
        return 'status-badge';
    }
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

  // Add getCombinedStatusBadge function
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

  return (
    <div className="pending-requests-container">
      <div className="requests-header">
        <h2 className="requests-title">All Requests</h2>
      </div>
      <div className="tabs-container">
        <ul className="tabs-list">
          <li className={`tab-item ${activeTab === 'all' ? 'active' : ''}`} onClick={() => handleTabClick('all')}>
            All Requests ({requestCounts.total})
          </li>
          <li className={`tab-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => handleTabClick('pending')}>
            Pending ({requestCounts.pending})
          </li>
          <li className={`tab-item ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => handleTabClick('approved')}>
            Approved ({requestCounts.approved})
          </li>
          <li className={`tab-item ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => handleTabClick('rejected')}>
            Rejected ({requestCounts.rejected})
          </li>
        </ul>
        <div className="view-toggle">
          <button className={`view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
            <span className="view-icon">📋</span> Table View
          </button>
          <button className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')}>
            <span className="view-icon">🗂️</span> Card View
          </button>
        </div>
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
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="requests-table-container">
        {viewMode === 'table' ? (
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
              {loading ? (
                <tr>
                  <td colSpan="6">Loading requests...</td>
                </tr>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map(request => (
                  <tr key={request._id}>
                    <td>
                      <div className="faculty-name">{request.facultyId?.name || request.facultyId?.email?.split('@')[0] || 'Unknown'}</div>
                      <div className="faculty-email">{request.facultyId?.email || 'No email'}</div>
                      <div className="faculty-department">{request.facultyId?.department || 'No department'}</div>
                    </td>
                    <td>{new Date(request.date).toLocaleDateString('en-GB')}</td>
                    <td>Out: {request.timeOut}<br />In: {request.timeIn}</td>
                    <td>{request.purpose}</td>
                    <td>{request.reason}</td>
                    <td>
                      {request.status === 'pending_emergency_allowed' && request.statusDetail ? (
                        <span className={statusBadgeClass(request.status)}>
                          <span className="emergency-emoji">🚨</span>{request.statusDetail.replace('🚨', '').trim()}
                        </span>
                      ) : (
                        getCombinedStatusBadge(request)
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">No requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="request-cards">
            {filteredRequests.length > 0 ? (
              filteredRequests.map(request => (
                <div key={request._id} className="request-card">
                  <div className="request-card-header">
                    <h3 className="request-card-title">Gate Pass Request</h3>
                    {request.status === 'pending_emergency_allowed' && request.statusDetail ? (
                      <span className={statusBadgeClass(request.status)}>
                        <span className="emergency-emoji">🚨</span>{request.statusDetail.replace('🚨', '').trim()}
                      </span>
                    ) : (
                      getCombinedStatusBadge(request)
                    )}
                  </div>
                  <div className="request-card-body">
                    <div className="request-info-item">
                      <span className="info-label">Faculty</span>
                      <span className="info-value faculty-name">{request.facultyId?.name || request.facultyId?.email?.split('@')[0] || 'Unknown'}</span>
                      <span className="info-value faculty-email">{request.facultyId?.email || 'No email'}</span>
                      <span className="info-value faculty-department">{request.facultyId?.department || 'No department'}</span>
                    </div>
                    <div className="info-group">
                      <div className="request-info-item">
                        <span className="info-label">Date</span>
                        <span className="info-value">{new Date(request.date).toLocaleDateString('en-GB')}</span>
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
                      <span className={`purpose-badge purpose-${(request.purpose || '').toLowerCase()}`}>{request.purpose}</span>
                    </div>
                    <div className="request-info-item">
                      <span className="info-label">Reason</span>
                      <div className="request-reason">{request.reason}</div>
                    </div>
                  </div>
                  <div className="request-card-footer">
                    <div className="request-date">Request ID: {request._id?.substring(0, 8)}...</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-requests">No requests found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrarAllRequests; 