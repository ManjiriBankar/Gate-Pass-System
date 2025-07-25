const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT and principal role
const principalMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'principal') {
      return res.status(403).json({ message: 'Not authorized as principal' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

// GET /api/principal/all-requests - HOD and Admin requests
router.get('/all-requests', principalMiddleware, async (req, res) => {
  try {
    const { date, facultyName, status } = req.query;
    // Find all users who are HODs or Admins
    const hodOrAdminUsers = await User.find({ $or: [ { designation: 'HOD' }, { role: 'admin' } ] }, '_id name email department designation role');
    let userIds = hodOrAdminUsers.map(u => u._id);
    let userMap = {};
    hodOrAdminUsers.forEach(u => { userMap[u._id.toString()] = u; });
    let query = { facultyId: { $in: userIds } };
    if (date) query.date = date;
    let allRequests = await LeaveRequest.find(query)
      .populate('facultyId', 'name email department designation role')
      .sort({ createdAt: -1 });
    // Filter by facultyName (name or email)
    if (facultyName) {
      allRequests = allRequests.filter(r => {
        const faculty = r.facultyId || userMap[r.facultyId?.toString()];
        if (!faculty) return false;
        const name = faculty.name?.toLowerCase() || '';
        const email = faculty.email?.toLowerCase() || '';
        return name.includes(facultyName.toLowerCase()) || email.includes(facultyName.toLowerCase());
      });
    }
    // Filter by status if provided
    let requests = allRequests;
    if (status && status !== 'all') {
      if (status === 'approved') requests = allRequests.filter(r => r.status === 'approved' || r.status === 'registrar_approved');
      else if (status === 'rejected') requests = allRequests.filter(r => r.status === 'rejected' || r.status === 'registrar_rejected');
      else requests = allRequests.filter(r => r.status === status);
    }
    // Optionally, add counts by status for UI
    const counts = {
      all: allRequests.length,
      pending: allRequests.filter(r => r.status === 'pending' || r.status === 'pending_emergency_allowed').length,
      approved: allRequests.filter(r => r.status === 'approved' || r.status === 'registrar_approved').length,
      rejected: allRequests.filter(r => r.status === 'rejected' || r.status === 'registrar_rejected').length,
    };
    // Set statusDetail to 'Pending By Principal' for pending HOD or admin requests
    requests.forEach(r => {
      if (r.status === 'pending' || r.status === 'pending_emergency_allowed') {
        r.statusDetail = 'Pending By Principal';
      }
    });
    res.json({ requests, counts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch HOD/Admin requests', error: err.message });
  }
});

// POST /api/principal/update-request - Update status of HOD requests
router.post('/update-request', principalMiddleware, async (req, res) => {
  try {
    const { requestId, status } = req.body;
    if (!requestId || !status) {
      return res.status(400).json({ message: 'Request ID and status are required' });
    }
    // Find the request and ensure it belongs to a HOD
    const request = await LeaveRequest.findById(requestId).populate('facultyId');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.facultyId.designation !== 'HOD') {
      return res.status(403).json({ message: 'Only HOD requests can be updated by principal' });
    }
    // Update status
    request.status = status;
    if (status === 'pending_emergency_allowed') {
      request.statusDetail = '🚨 Emergency Approved By Principal';
    } else if (status === 'approved') {
      request.statusDetail = '✔️ Approved By Principal';
    } else if (status === 'rejected') {
      request.statusDetail = '❌ Rejected By Principal';
    } else {
      request.statusDetail = '';
    }
    await request.save();
    res.json({ message: 'Request status updated', request });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update request', error: err.message });
  }
});

module.exports = router; 