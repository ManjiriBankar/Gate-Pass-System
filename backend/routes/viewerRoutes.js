const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");

const router = express.Router();

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    // Try both headers to support different client implementations
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-auth-token'];
    console.log("Auth token received in header:", token ? "Present" : "Missing");
    
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded - userId:", decoded.userId, "role:", decoded.role);
      req.user = decoded;
      next();
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError.message);
      return res.status(401).json({ message: "Token is not valid", error: jwtError.message });
    }
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Viewer middleware to check if user is viewer
const viewerMiddleware = (req, res, next) => {
  console.log("Viewer middleware - User role:", req.user.role);
  
  // Case-insensitive check
  if (!req.user.role || req.user.role.toLowerCase() !== 'viewer') {
    return res.status(403).json({ message: "Not authorized as viewer" });
  }
  next();
};

// Get all requests (focused on approved and rejected requests)
router.get("/all-requests", authMiddleware, viewerMiddleware, async (req, res) => {
  try {
    console.log("Processing all-requests endpoint for viewer");
    
    // Get all requests with all 5 status types
    const query = {
      status: { $in: ["pending", "approved", "rejected", "registrar_approved", "registrar_rejected", "pending_emergency_allowed"] }
    };
    console.log("Using database query:", JSON.stringify(query));
    
    let allRequests = await LeaveRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('facultyId', 'name email employeeId department');
    
    // Also include requests with statusDetail '✔️ Approved By Principal' or '❌ Rejected By Principal' if not already in the above
    const principalStatusRequests = await LeaveRequest.find({
      $or: [
        { statusDetail: '✔️ Approved By Principal' },
        { statusDetail: '❌ Rejected By Principal' }
      ]
    }).populate('facultyId', 'name email employeeId department');

    // Merge, avoiding duplicates by _id
    const allRequestIds = new Set(allRequests.map(r => r._id.toString()));
    principalStatusRequests.forEach(r => {
      if (!allRequestIds.has(r._id.toString())) {
        allRequests.push(r);
      }
    });
    
    console.log(`Found ${allRequests.length} requests for viewer`);
    
    // Log the first result for debugging (if available)
    if (allRequests.length > 0) {
      console.log("Sample request data:", JSON.stringify({
        _id: allRequests[0]._id,
        status: allRequests[0].status,
        facultyEmail: allRequests[0].facultyEmail,
        facultyId: allRequests[0].facultyId,
        allowed: allRequests[0].allowed
      }));
    }
    
    res.status(200).json(allRequests);
  } catch (err) {
    console.error("Error fetching requests:", err.message);
    if (err.name === 'CastError') {
      console.error("Database cast error - invalid ID format");
    } else if (err.name === 'ValidationError') {
      console.error("Database validation error:", err.errors);
    }
    res.status(500).json({ error: err.message, errorType: err.name });
  }
});

// Get all requests that have been marked as allowed (for gate control)
router.get("/all-allowed", authMiddleware, viewerMiddleware, async (req, res) => {
  try {
    console.log("Processing all-allowed endpoint for viewer");
    
    const query = {
      allowed: true
    };
    console.log("Using database query:", JSON.stringify(query));
    
    const allowedRequests = await LeaveRequest.find(query)
      .sort({ allowedAt: -1 }) // Most recently allowed first
      .populate('facultyId', 'name email employeeId department');
    
    console.log(`Found ${allowedRequests.length} allowed requests`);
    
    // Log the first result for debugging (if available)
    if (allowedRequests.length > 0) {
      console.log("Sample allowed request data:", JSON.stringify({
        _id: allowedRequests[0]._id,
        status: allowedRequests[0].status,
        facultyEmail: allowedRequests[0].facultyEmail,
        allowedAt: allowedRequests[0].allowedAt
      }));
    }
    
    res.status(200).json(allowedRequests);
  } catch (err) {
    console.error("Error fetching allowed requests:", err.message);
    res.status(500).json({ error: err.message, errorType: err.name });
  }
});

// Mark a request as allowed (for gate access)
router.put("/mark-allowed/:requestId", authMiddleware, viewerMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log("Processing mark-allowed for requestId:", requestId);
    
    // Validate requestId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      console.error("Invalid request ID format:", requestId);
      return res.status(400).json({ message: "Invalid request ID format" });
    }
    
    // Find the request
    const request = await LeaveRequest.findById(requestId);
    if (!request) {
      console.error("Request not found with ID:", requestId);
      return res.status(404).json({ message: "Request not found" });
    }
    
    console.log("Found request with status:", request.status, "allowed:", request.allowed);
    
    // Allow any status to be marked as allowed (including pending for emergency)
    // Update the request
    request.allowed = true;
    request.allowedBy = req.user.userId;
    request.allowedAt = new Date();
    
    // If it's a pending request, update status to indicate emergency allowance
    if (request.status === "pending") {
      request.status = "pending_emergency_allowed";
      request.statusDetail = "Pending - Allowed For Emergency";
    }
    
    await request.save();
    console.log("Request successfully marked as allowed:", requestId);
    
    res.status(200).json({
      message: "Request marked as allowed successfully",
      request
    });
  } catch (err) {
    console.error("Error marking request as allowed:", err.message);
    res.status(500).json({ error: err.message, errorType: err.name });
  }
});

// Mark a request as returned (after being allowed)
router.put("/mark-returned/:requestId", authMiddleware, viewerMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log("Processing mark-returned for requestId:", requestId);
    
    // Validate requestId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      console.error("Invalid request ID format:", requestId);
      return res.status(400).json({ message: "Invalid request ID format" });
    }
    
    // Find the request
    const request = await LeaveRequest.findById(requestId);
    if (!request) {
      console.error("Request not found with ID:", requestId);
      return res.status(404).json({ message: "Request not found" });
    }
    
    console.log("Found request with status:", request.status, "allowed:", request.allowed);
    
    // Check if request has been allowed first
    if (!request.allowed) {
      console.error("Cannot mark request as returned if not allowed first");
      return res.status(400).json({ 
        message: "Cannot mark a request as returned if it hasn't been allowed first." 
      });
    }
    
    // Update the request to mark as returned
    request.returned = true;
    request.returnedAt = new Date();
    request.returnedBy = req.user.userId;
    
    await request.save();
    console.log("Request successfully marked as returned:", requestId);
    
    res.status(200).json({
      message: "Request marked as returned successfully",
      request
    });
  } catch (err) {
    console.error("Error marking request as returned:", err.message);
    res.status(500).json({ error: err.message, errorType: err.name });
  }
});

module.exports = router; 