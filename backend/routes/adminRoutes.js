const express = require("express");
const jwt = require("jsonwebtoken");
const LeaveRequest = require("../models/LeaveRequest");
const { sendEmail } = require("../config/email");
const User = require("../models/User");

const router = express.Router();

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

// Admin middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Not authorized as admin" });
  }
  next();
};

// Get all pending requests
router.get("/pending-requests", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get admin's department
    const admin = await User.findById(req.user.userId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    // Find all pending requests, populate full facultyId
    const pendingRequests = await LeaveRequest.find({ status: "pending" })
      .populate('facultyId');
    // Debug log
    console.log('Admin department:', admin.department);
    console.log('Pending requests faculty departments:', pendingRequests.map(r => r.facultyId && r.facultyId.department));
    // Filter requests to only those matching admin's department (case-insensitive, trimmed) and not HODs (both 'HOD' and 'Head Of The Department')
    const filteredRequests = pendingRequests.filter(r => r.facultyId && r.facultyId.department && r.facultyId.department.trim().toLowerCase() === admin.department.trim().toLowerCase() && r.facultyId.designation !== 'HOD' && r.facultyId.designation !== 'Head Of The Department');
    res.status(200).json(filteredRequests);
  } catch (err) {
    console.error("Error fetching pending requests:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all requests with optional status and date filtering
router.get("/all-requests", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, date, facultyEmail } = req.query;
    // Get admin's department
    const admin = await User.findById(req.user.userId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    // Build query object based on filters
    const query = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    } else if (!status) {
      // For 'all' tab, include all relevant statuses
      query.status = { $in: ["pending", "approved", "rejected", "registrar_approved", "registrar_rejected", "pending_emergency_allowed"] };
    }
    if (facultyEmail) {
      query.facultyEmail = { $regex: facultyEmail, $options: 'i' };
    }
    if (date) {
      query.date = date;
    }
    // Find all requests, populate full facultyId
    const requests = await LeaveRequest.find(query).populate('facultyId');
    // Debug log
    console.log('Admin department:', admin.department);
    console.log('All requests faculty departments:', requests.map(r => r.facultyId && r.facultyId.department));
    // Filter requests to only those matching admin's department (case-insensitive, trimmed) and not HODs (both 'HOD' and 'Head Of The Department')
    const departmentalRequests = requests.filter(r => r.facultyId && r.facultyId.department && r.facultyId.department.trim().toLowerCase() === admin.department.trim().toLowerCase() && r.facultyId.designation !== 'HOD' && r.facultyId.designation !== 'Head Of The Department');
    // Prepare response with counts
    const response = {
      requests: departmentalRequests,
      counts: {
        all: departmentalRequests.length,
        pending: departmentalRequests.filter(r => r.status === 'pending').length,
        approved: departmentalRequests.filter(r => r.status === 'approved' || r.status === 'registrar_approved').length,
        rejected: departmentalRequests.filter(r => r.status === 'rejected' || r.status === 'registrar_rejected').length
      },
      department: admin.department
    };
    res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ error: err.message });
  }
});


//-------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * Generate email content for leave request status update
 */
const generateEmailContent = (request, adminName, status) => {
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);
  const facultyName = request.facultyEmail.split('@')[0]; // Simple name extraction
  
  // Format date for display
  const formatDate = (dateStr) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };
  
  const formatTime = (timeStr) => {
    return timeStr || "N/A";
  };
  
  // Text version
  const text = `
KBT College of Engineering
Nashik, Maharashtra

Gate Pass Request Notification
------------------------------

Dear Faculty Member,

Your gate pass request (Ref: ${request._id.substring(0, 8)}) for ${formatDate(request.date)} has been ${status.toLowerCase()} by the college administration.

Request Details:
- Date: ${request.date}
- Time Out: ${formatTime(request.timeOut)}
- Time In: ${formatTime(request.timeIn)}
- Purpose: ${request.purpose}
- Reason: ${request.reason}

This request was processed by: ${adminName}
Status: ${statusText}

Please note that you must present your ID card at the gate when entering/exiting the campus.

For any queries regarding this gate pass, please contact the administration office.

Regards,
Administration Department
KBT College of Engineering
`;

  // HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gate Pass Request Notification</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 650px; margin: 0 auto; padding: 0; }
    .header { text-align: center; padding: 20px 0; background-color: #004080; color: white; }
    .header img { max-height: 80px; margin-bottom: 10px; }
    .college-name { font-size: 22px; font-weight: bold; margin: 0; }
    .college-tagline { font-size: 14px; margin: 5px 0 0; font-style: italic; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .title { font-size: 20px; color: #004080; margin-top: 0; border-bottom: 2px solid #004080; padding-bottom: 10px; }
    .greeting { margin-bottom: 15px; }
    .status-approved { color: #2e7d32; font-weight: bold; }
    .status-rejected { color: #c62828; font-weight: bold; }
    .status-pending { color: #f57c00; font-weight: bold; }
    .details { background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #ddd; }
    .detail-row { display: flex; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .detail-label { font-weight: bold; width: 100px; color: #555; }
    .detail-value { flex: 1; }
    .purpose-value { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 14px; }
    .purpose-personal { background-color: #e3f2fd; color: #1565c0; }
    .purpose-official { background-color: #e8f5e9; color: #2e7d32; }
    .purpose-medical { background-color: #fbe9e7; color: #c62828; }
    .info-box { background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 10px 15px; margin: 20px 0; }
    .signature { margin-top: 30px; }
    .footer { text-align: center; padding: 15px; background-color: #eeeeee; font-size: 12px; color: #666; }
    .ref-number { font-size: 12px; color: #666; margin-top: 15px; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- College Logo would go here -->
      <h1 class="college-name">KBT College of Engineering</h1>
      <p class="college-tagline">Nashik, Maharashtra</p>
    </div>
    
    <div class="content">
      <h2 class="title">Gate Pass Request Notification</h2>
      
      <p class="greeting">Dear Faculty Member,</p>
      
      <p>Your gate pass request for <strong>${formatDate(request.date)}</strong> has been 
        <span class="status-${status.toLowerCase()}">${status.toLowerCase()}</span> by the college administration.</p>
      
      <div class="details">
        <h3>Request Details:</h3>
        
        <div class="detail-row">
          <div class="detail-label">Request ID:</div>
          <div class="detail-value">${request._id.substring(0, 8)}...</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Date:</div>
          <div class="detail-value">${formatDate(request.date)}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Time Out:</div>
          <div class="detail-value">${formatTime(request.timeOut)}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Time In:</div>
          <div class="detail-value">${formatTime(request.timeIn)}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Purpose:</div>
          <div class="detail-value">
            <span class="purpose-value purpose-${request.purpose.toLowerCase()}">${request.purpose}</span>
          </div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Reason:</div>
          <div class="detail-value">${request.reason}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Status:</div>
          <div class="detail-value status-${status.toLowerCase()}">${statusText}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Processed by:</div>
          <div class="detail-value">${adminName}</div>
        </div>
      </div>
      
      <div class="info-box">
        <strong>Important:</strong> Please present your ID card at the gate when entering/exiting the campus. 
        This gate pass is valid only for the date and time mentioned above.
      </div>
      
      <p>For any queries regarding this gate pass, please contact the administration office.</p>
      
      <div class="signature">
        <p>Regards,<br>
        Administration Department<br>
        KBT College of Engineering</p>
      </div>
      
      <p class="ref-number">Reference ID: ${request._id}</p>
    </div>
    
    <div class="footer">
      <p>This is an automated email from the KBT College of Engineering Gate Pass System.</p>
      <p>© ${new Date().getFullYear()} KBT College of Engineering. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
};

// Approve/Reject Request
router.post("/update-request", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { requestId, status } = req.body;
    if (!["approved", "rejected", "pending", "pending_emergency_allowed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await LeaveRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Get admin user for the email
    const admin = await User.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update the status
    request.status = status;
    if (status === 'approved') {
      request.statusDetail = 'Approved by HOD';
      request.hodStatus = 'approved';
      request.registrarStatus = 'pending'; // Reset registrar status when HOD acts
    } else if (status === 'rejected') {
      request.statusDetail = 'Rejected by HOD';
      request.hodStatus = 'rejected';
      request.registrarStatus = 'pending';
    } else if (status === 'pending_emergency_allowed') {
      request.statusDetail = '🚨Emergency Approved By HOD';
      request.hodStatus = 'approved';
      request.registrarStatus = 'pending';
    } else {
      request.statusDetail = '';
      request.hodStatus = 'pending';
      request.registrarStatus = 'pending';
    }
    await request.save();
    
    // Send email for approved/rejected status
    if (status === "approved" || status === "rejected") {
      try {
        const { text, html } = generateEmailContent(request, admin.name, status);
        const emailSent = await sendEmail(
          request.facultyEmail,
          `Gate Pass Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          text,
          html
        );
        if (!emailSent) {
          console.warn(`Warning: Email notification to ${request.facultyEmail} failed.`);
        }
      } catch (emailErr) {
        console.warn(`Email sending failed for ${request.facultyEmail}:`, emailErr.message);
        // Do not throw, just log
      }
    }

    res.status(200).json({ 
      message: `Request ${status} successfully`,
      emailSent: true
    });
  } catch (err) {
    console.error("Error updating request:", err);
    res.status(500).json({ error: err.message });
  }
});








//-------------------------------------------------------------------------------------------------------------------------------
// Add a diagnostic endpoint
router.get("/diagnostic", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get all requests regardless of status
    const allRequests = await LeaveRequest.find({});
    
    // Count by status
    const statusCounts = {
      total: allRequests.length,
      pending: allRequests.filter(r => r.status === "pending").length,
      approved: allRequests.filter(r => r.status === "approved").length,
      rejected: allRequests.filter(r => r.status === "rejected").length
    };
    
    // Get admin info
    const admin = await User.findById(req.user.userId);
    
    // Sample approved requests
    const approvedSamples = allRequests
      .filter(r => r.status === "approved")
      .slice(0, 3)
      .map(r => ({
        id: r._id,
        faculty: r.facultyEmail,
        facultyId: r.facultyId,
        status: r.status,
        date: r.date
      }));
    
    res.json({
      statusCounts,
      adminRole: admin.role,
      adminEmail: admin.email,
      approvedSamples: approvedSamples,
      message: "Diagnostic data retrieved successfully"
    });
  } catch (err) {
    console.error("Diagnostic error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Special debug route for date formats
router.get("/debug-dates", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get sample of requests
    const requests = await LeaveRequest.find({}).limit(10);
    
    // Extract and transform dates
    const dateInfo = requests.map(req => ({
      id: req._id,
      rawDate: req.date,
      type: typeof req.date,
      isISODate: /^\d{4}-\d{2}-\d{2}/.test(req.date),
      format: /^\d{4}-\d{2}-\d{2}/.test(req.date) ? 'YYYY-MM-DD' : 
              /^\d{1,2}\/\d{1,2}\/\d{4}/.test(req.date) ? 'MM/DD/YYYY or DD/MM/YYYY' :
              'unknown',
      status: req.status
    }));
    
    res.status(200).json({
      dateInfo,
      message: "Date format debugging information"
    });
  } catch (err) {
    console.error("Error in debug route:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
