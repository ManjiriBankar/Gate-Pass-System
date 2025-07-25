import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UpdateRequest.css';

const UpdateRequest = () => {
  const [requests, setRequests] = useState([]);
  const [requestCounts, setRequestCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [filters, setFilters] = useState({
    date: '',
    facultyName: '',
  });
  const [uniqueFaculty, setUniqueFaculty] = useState([]);
  const [serverStatus, setServerStatus] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');

  // Check backend server status
  const checkServerStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/status');
      console.log('Server status:', response.data);
      setServerStatus(response.data);
      return response.data;
    } catch (err) {
      console.error('Cannot connect to server:', err);
      setServerStatus({ server: 'offline', error: err.message });
      setError('Cannot connect to server. Please make sure the backend server is running.');
      return null;
    }
  };

  const fetchRequests = async (filterParams = {}) => {
    try {
      // First check if server is accessible
      const status = await checkServerStatus();
      if (!status || status.server !== 'running' || status.mongodb !== 'connected') {
        if (status && status.mongodb !== 'connected') {
          setError('Database connection issue. Please contact administrator.');
        }
        return;
      }
      
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filterParams.status && filterParams.status !== 'all') {
        // Handle special cases for approved and rejected status
        if (filterParams.status === 'approved') {
          queryParams.append('status', 'approved');
          // We'll handle registrar_approved in client-side filtering
        } else if (filterParams.status === 'rejected') {
          queryParams.append('status', 'rejected');
          // We'll handle registrar_rejected in client-side filtering
        } else {
          queryParams.append('status', filterParams.status);
        }
      }
      if (filterParams.date) {
        queryParams.append('date', filterParams.date);
      }
      if (filterParams.facultyName) {
        queryParams.append('facultyEmail', filterParams.facultyName);
      }
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      console.log("Fetching requests with URL:", `http://localhost:5000/api/admin/all-requests${queryString}`);
      
      const response = await axios.get(`http://localhost:5000/api/admin/all-requests${queryString}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Response data:", {
        totalRequests: response.data.requests.length,
        counts: response.data.counts,
        department: response.data.department,
        statuses: response.data.requests.map(r => r.status)
      });
      
      setRequests(response.data.requests);
      setRequestCounts(response.data.counts);
      setDepartment(response.data.department);
      
      // Extract unique faculty names
      const facultyNames = [...new Set(response.data.requests.map(req => 
        req.facultyId?.name || req.facultyEmail.split('@')[0]
      ))];
      setUniqueFaculty(facultyNames);
    } catch (err) {
      console.error('Error fetching requests:', err);
      
      // More specific error handling
      if (err.code === 'ECONNREFUSED' || !err.response) {
        setError('Cannot connect to server. Please make sure the backend server is running.');
      } else if (err.response?.status === 401) {
        setError('Authentication error. Please log in again.');
        // Optional: Redirect to login page
        // navigate('/login');
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

    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    // First check server status, then fetch requests if server is running
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

  // Re-fetch when active tab changes
  useEffect(() => {
    if (user && user.role === 'admin') {
      const tabStatus = activeTab === 'all' ? null : activeTab;
      console.log(`Tab changed to: ${activeTab}, fetching with status: ${tabStatus || 'all'}`);
      
      // Clear filters when changing tabs to prevent unexpected filtering
      setFilters({
        date: '',
        facultyName: ''
      });
      
      // For approved and rejected tabs, we'll handle the filtering on the client side
      // after fetching all relevant statuses
      if (activeTab === 'approved' || activeTab === 'rejected') {
        // Don't pass status filter to fetchRequests, we'll handle it in handleApprovedTabClick or handleRejectedTabClick
        if (activeTab === 'approved') {
          handleApprovedTabClick();
        } else {
          handleRejectedTabClick();
        }
      } else {
        fetchRequests({
          status: tabStatus
        });
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

  // This function handles clicking on the Approved tab directly
  const handleApprovedTabClick = () => {
    console.log("Approved tab clicked directly");
    setActiveTab('approved');
    setLoading(true);
    
    // Fetch both HOD-approved and registrar-approved requests
    const token = localStorage.getItem('token');
    
    // We'll fetch all requests and filter them client-side
    // This ensures we get both 'approved' and 'registrar_approved' statuses
    axios.get('http://localhost:5000/api/admin/all-requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      console.log("Fetched all requests for approved tab:", {
        totalRequests: response.data.requests.length
      });
      
      // Filter to include both HOD-approved and registrar-approved requests
      const approvedRequests = response.data.requests.filter(req => 
        req.status === 'approved' || 
        req.status === 'registrar_approved' ||
        (req.statusDetail && req.statusDetail.toLowerCase().includes('approved'))
      );
      
      console.log("Filtered approved requests:", {
        approvedCount: approvedRequests.length,
        statuses: approvedRequests.map(r => r.status)
      });
      
      // Set state with filtered requests
      setRequests(approvedRequests);
      
      // Update the counts to reflect our filtered data
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
      console.error("Error fetching approved requests:", err);
      setError("Failed to load approved requests. See console for details.");
      setLoading(false);
    });
  };
  
  // This function handles clicking on the Rejected tab directly
  const handleRejectedTabClick = () => {
    console.log("Rejected tab clicked directly");
    setActiveTab('rejected');
    setLoading(true);
    
    // Fetch both HOD-rejected and registrar-rejected requests
    const token = localStorage.getItem('token');
    
    // We'll fetch all requests and filter them client-side
    // This ensures we get both 'rejected' and 'registrar_rejected' statuses
    axios.get('http://localhost:5000/api/admin/all-requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      console.log("Fetched all requests for rejected tab:", {
        totalRequests: response.data.requests.length
      });
      
      // Filter to include both HOD-rejected and registrar-rejected requests
      const rejectedRequests = response.data.requests.filter(req => 
        req.status === 'rejected' || 
        req.status === 'registrar_rejected' ||
        (req.statusDetail && req.statusDetail.toLowerCase().includes('rejected'))
      );
      
      console.log("Filtered rejected requests:", {
        rejectedCount: rejectedRequests.length,
        statuses: rejectedRequests.map(r => r.status)
      });
      
      // Set state with filtered requests
      setRequests(rejectedRequests);
      
      // Update the counts to reflect our filtered data
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
      console.error("Error fetching rejected requests:", err);
      setError("Failed to load rejected requests. See console for details.");
      setLoading(false);
    });
  };

  const handleUpdateStatus = async (requestId, status) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log(`Updating request ${requestId} to status: ${status}`);
      
      const response = await axios.post('http://localhost:5000/api/admin/update-request', 
      { 
        requestId, 
        status 
      }, 
      {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Update response:', response.data);
      
      // Update the local state to reflect the change
      const updatedRequests = requests.map(request => 
        request._id === requestId ? { ...request, status } : request
      );
      setRequests(updatedRequests);
      
      // Update counts
      const oldStatus = requests.find(r => r._id === requestId)?.status;
      const newCounts = {
        ...requestCounts,
        [oldStatus]: Math.max(0, requestCounts[oldStatus] - 1),
        [status]: requestCounts[status] + 1
      };
      setRequestCounts(newCounts);
      
      console.log('Updated counts:', newCounts);
      
      // Show success message about email notification
      if (status === 'approved' || status === 'rejected') {
        const faculty = requests.find(r => r._id === requestId)?.facultyId?.name || requests.find(r => r._id === requestId)?.facultyEmail.split('@')[0];
        setSuccessMessage(`Request ${status} successfully. Email notification sent to ${faculty}.`);
        
        // Clear success message after a few seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
        
        // If we're updating to approved and we're not currently on the approved tab,
        // we should make sure the approved count is accurate
        if (status === 'approved' && activeTab !== 'approved') {
          console.log('Updating request to approved - will update counts');
          
          // Optional: immediately fetch the approved requests to update the count
          if (newCounts.approved === 1) {
            console.log('First approved request - fetching approved tab data');
            // Fetch approved requests to ensure they're in the system
            try {
              const approvedResponse = await axios.get(
                'http://localhost:5000/api/admin/all-requests?status=approved', 
                { headers: { Authorization: `Bearer ${token}` } }
              );
              console.log('Approved requests after update:', approvedResponse.data.counts);
            } catch (err) {
              console.error('Error checking approved requests:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error ${status} request:`, err);
      
      // More specific error handling
      if (err.code === 'ECONNREFUSED' || !err.response) {
        setError('Cannot connect to server. Please make sure the backend server is running.');
      } else if (err.response?.status === 401) {
        setError('Authentication error. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to update request status.');
      } else if (err.response?.status === 404) {
        setError('Request not found. It may have been deleted.');
        // Refresh the list to remove the deleted request
        fetchRequests({
          status: activeTab === 'all' ? null : activeTab
        });
      } else {
        setError(err.response?.data?.message || `Failed to ${status} request. Please try again.`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`Filter changed: ${name} = ${value}`);
    
    // For date filter, make sure we have a valid date
    if (name === 'date') {
      console.log(`Setting date filter to: ${value}`);
    }
    
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    console.log("Applying filters:", filters);
    
    // Format the date if needed
    const filterParams = {
      status: activeTab === 'all' ? null : activeTab,
      facultyName: filters.facultyName
    };
    
    // Only add date if it's not empty
    if (filters.date) {
      // Keep the date in the same format as stored in database (YYYY-MM-DD)
      filterParams.date = filters.date;
      console.log("Using date filter:", filters.date);
      
      // Show loading message
      setLoading(true);
      setError('');
      
      // Add clear message about filtering
      setSuccessMessage(`Searching for requests on ${formatDate(filters.date)}...`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
    
    fetchRequests(filterParams);
  };

  const clearFilters = () => {
    setFilters({
      date: '',
      facultyName: '',
    });
    
    // Reset to fetch all requests based on current tab
    fetchRequests({
      status: activeTab === 'all' ? null : activeTab
    });
  };

  // Apply filters to requests if needed (for client-side filtering)
  const filteredRequests = requests
    .filter(request => {
      if (activeTab === 'all') return true;
      if (activeTab === 'approved') {
        // Enhanced filtering for approved requests
        return (request.statusDetail && request.statusDetail.toLowerCase().includes('approved')) ||
          request.status === 'approved' || request.status === 'registrar_approved';
      }
      if (activeTab === 'rejected') {
        // Enhanced filtering for rejected requests
        return (request.statusDetail && request.statusDetail.toLowerCase().includes('rejected')) ||
          request.status === 'rejected' || request.status === 'registrar_rejected';
      }
      return request.status === activeTab;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
    <div className="update-request-container">
      <div className="update-dashboard-header">
        {/* <h1 className="update-dashboard-title">Gate Pass Request Manager</h1>
        
        <div className="admin-role-info">
          <p className="admin-note">You are viewing all gate pass requests as an admin.</p>
        </div>
         */}
        {serverStatus && serverStatus.server !== 'running' && (
          <div className="server-status error">
            <div className="status-icon">❌</div>
            <div className="status-text">
              <strong>Server Issue</strong>
              <span>The server is currently unavailable</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="update-requests-container">
        <div className="update-requests-header">
          <h2 className="update-requests-title">
            All Gate Pass Requests
            {getDisplayedCount() > 0 && (
              <span className="requests-count">{getDisplayedCount()}</span>
            )}
          </h2>
          <p className="update-requests-description">
            You are viewing requests for the <strong>{department}</strong> department.
          </p>
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
        
        {successMessage && (
          <div className="alert alert-success" role="alert">
            <span>{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage('')}
              className="ml-auto"
            >
              &times;
            </button>
          </div>
        )}
        
        <div className="tabs-container">
          <ul className="tabs-list">
            <li
              className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({requestCounts.all})
            </li>
            <li
              className={`tab-item ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({requestCounts.pending})
            </li>
            <li
              className={`tab-item ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={handleApprovedTabClick}
            >
              Approved ({requestCounts.approved})
            </li>
            <li
              className={`tab-item ${activeTab === 'rejected' ? 'active' : ''}`}
              onClick={handleRejectedTabClick}
            >
              Rejected ({requestCounts.rejected})
            </li>
          </ul>
          
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`} 
              onClick={() => setViewMode('table')}
            >
              <span className="view-icon">📋</span> Table View
            </button>
            <button 
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`} 
              onClick={() => setViewMode('cards')}
            >
              <span className="view-icon">🗂️</span> Card View
            </button>
          </div>
        </div>
        
        {/* Filters Section */}
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
            
            <button 
              onClick={applyFilters}
              className="apply-filters-btn"
              disabled={actionLoading}
            >
              Apply Filters
            </button>
            
            <button 
              onClick={clearFilters}
              className="clear-filters-btn"
              disabled={actionLoading}
            >
              Clear Filters
            </button>
          </div>
          
          <div className="filter-summary">
            <p>
              Showing {filteredRequests.length} {activeTab !== 'all' ? activeTab : ''} requests
              {(filters.date || filters.facultyName) && ' matching filters'}
            </p>
            
            {/* Debug button for troubleshooting */}
            {filters.date && filteredRequests.length === 0 && (
              <button 
                className="debug-btn"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get('http://localhost:5000/api/admin/debug-dates', {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log("Date Format Debug:", response.data);
                    
                    // Extract date formats from debugging info
                    const formats = response.data.dateInfo.map(d => d.rawDate);
                    
                    setSuccessMessage(
                      `Date formats in database: ${formats.join(', ')}`
                    );
                    
                    // Give more specific guidance
                    console.log("Your filter:", filters.date);
                    console.log("Database dates:", formats);
                    console.log("Try using one of these exact formats for filtering");
                    
                  } catch (err) {
                    console.error("Error fetching date formats:", err);
                    setError("Could not check date formats");
                  }
                }}
              >
                Check Date Formats
              </button>
            )}
          </div>
        </div>
        
        {filteredRequests.length > 0 ? (
          <>
            {/* Table View */}
            {viewMode === 'table' && (
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
                    {filteredRequests.map((request) => (
                      <tr 
                        key={request._id} 
                        className={`request-row status-${request.status}-row`}
                      >
                        <td>
                          <div className="faculty-name">{request.facultyId?.name || request.facultyEmail.split('@')[0]}</div>
                          <div className="faculty-email">{request.facultyEmail}</div>
                        </td>
                        <td>
                          <div className="request-date">
                            {formatDate(request.date)}
                          </div>
                        </td>
                        <td>
                          <div className="request-time">
                            <div>Out: {request.timeOut}</div>
                            <div>In: {request.timeIn || 'N/A'}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`purpose-badge purpose-${request.purpose.toLowerCase()}`}>
                            {request.purpose}
                          </span>
                        </td>
                        <td>{request.reason}</td>
                        <td>
                          {request.status === 'pending_emergency_allowed' && request.statusDetail ? (
                            <span className={getStatusBadgeClass(request.status)}>{request.statusDetail}</span>
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
            
            {/* Card View (existing) */}
            {viewMode === 'cards' && (
              <div className="request-cards">
                {filteredRequests.map((request) => (
                  <div key={request._id} className="request-card">
                    <div className="request-card-header">
                      <h3 className="request-card-title">Gate Pass Request</h3>
                      {/* Status at the top, using table view logic */}
                      {request.status === 'pending_emergency_allowed' && request.statusDetail ? (
                        <span className={getStatusBadgeClass(request.status)}>{request.statusDetail}</span>
                      ) : (
                        <div className="status-container">{getCombinedStatusBadge(request)}</div>
                      )}
                    </div>
                    <div className="request-card-body">
                      <div className="request-info-item">
                        <span className="info-label">Faculty</span>
                        <span className="info-value faculty-name">{request.facultyId?.name || request.facultyEmail.split('@')[0]}</span>
                        <span className="info-value faculty-email">{request.facultyEmail}</span>
                      </div>
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
                        <div className="request-reason">{request.reason}</div>
                      </div>
                    </div>
                    <div className="request-card-footer">
                      <div className="request-date">
                        Request ID: {request._id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="no-requests">
            <div className="no-requests-icon">📝</div>
            <div className="no-requests-message">No requests found</div>
            <p className="no-requests-suggestion">There are no gate pass requests matching your filter criteria.</p>
          </div>
        )}

        {activeTab === 'approved' && filteredRequests.length === 0 && requestCounts.approved > 0 && (
          <div className="data-mismatch-warning">
            <p>There seems to be a mismatch between the approved request count ({requestCounts.approved}) and the displayed data (0).</p>
            <button 
              onClick={handleApprovedTabClick}
              className="retry-btn"
            >
              Force Load Approved Requests
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateRequest;