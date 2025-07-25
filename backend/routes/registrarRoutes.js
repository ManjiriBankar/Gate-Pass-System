const express = require("express");
const jwt = require("jsonwebtoken");
const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");

const router = express.Router();

console.log('Registrar routes loaded');

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Registrar middleware
const registrarMiddleware = (req, res, next) => {
  if (req.user.role !== 'registrar') {
    return res.status(403).json({ message: "Not authorized as registrar" });
  }
  next();
};

// Get all requests relevant to registrar (approved, registrar_approved, registrar_rejected)
router.get("/approved-requests", authMiddleware, registrarMiddleware, async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ status: { $in: ["approved", "registrar_approved", "registrar_rejected", "pending_emergency_allowed"] } })
      .populate('facultyId');
    // Filter out requests where faculty's designation is 'HOD' or 'Head Of The Department'
    const filteredRequests = requests.filter(r => r.facultyId && r.facultyId.designation !== 'HOD' && r.facultyId.designation !== 'Head Of The Department');
    res.status(200).json(filteredRequests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar can approve/reject HOD-approved requests
router.post("/update-request", authMiddleware, registrarMiddleware, async (req, res) => {
  try {
    const { requestId, status } = req.body;
    if (!['registrar_approved', 'registrar_rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'registrar_approved' or 'registrar_rejected'." });
    }
    const request = await LeaveRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== 'approved') {
      return res.status(400).json({ message: "Only HOD-approved requests can be processed by Registrar." });
    }
    request.status = status;
    if (status === 'registrar_approved') {
      request.statusDetail = 'Approved by Registrar';
      request.registrarStatus = 'approved';
    } else if (status === 'registrar_rejected') {
      request.statusDetail = 'Rejected by Registrar';
      request.registrarStatus = 'rejected';
    } else {
      request.statusDetail = '';
      request.registrarStatus = 'pending';
    }
    await request.save();
    res.status(200).json({ message: `Request ${status.replace('registrar_', '')} successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all requests relevant to registrar with filters and counts
router.get("/all-requests", authMiddleware, registrarMiddleware, async (req, res) => {
  try {
    const { status, date, facultyName } = req.query;
    // Build base query for registrar-relevant statuses. This should NOT include 'pending'.
    let baseStatuses = ["approved", "registrar_approved", "registrar_rejected", "pending_emergency_allowed"];
    let baseQuery = { status: { $in: baseStatuses } };
    if (date) baseQuery.date = date;
    if (facultyName) {
      baseQuery.$or = [
        { 'facultyEmail': { $regex: facultyName, $options: 'i' } },
      ];
    }
    let allRequests = await LeaveRequest.find(baseQuery).populate('facultyId');
    allRequests = allRequests.filter(r => r.facultyId && r.facultyId.designation !== 'HOD' && r.facultyId.designation !== 'Head Of The Department');
    if (facultyName) {
      allRequests = allRequests.filter(r =>
        (r.facultyId?.name && r.facultyId.name.toLowerCase().includes(facultyName.toLowerCase())) ||
        (r.facultyEmail && r.facultyEmail.toLowerCase().includes(facultyName.toLowerCase()))
      );
    }
    // Now, filter for the current tab
    let requests = allRequests;
    if (status && status !== 'all') {
      if (status === 'approved') requests = allRequests.filter(r => r.status === 'registrar_approved');
      else if (status === 'rejected') requests = allRequests.filter(r => r.status === 'registrar_rejected');
      else if (status === 'pending') requests = allRequests.filter(r => r.status === 'approved');
      else if (status === 'hod_approved' || status === 'approved_by_hod') requests = allRequests.filter(r => r.status === 'approved');
      else requests = allRequests.filter(r => r.status === status);
    }
    // Calculate counts for all tabs based on the filtered set
    const counts = {
      total: allRequests.length,
      pending: allRequests.filter(r => r.status === 'approved').length,
      approved: allRequests.filter(r => r.status === 'registrar_approved').length,
      rejected: allRequests.filter(r => r.status === 'registrar_rejected').length
    };
    res.status(200).json({ requests, counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 