// Load environment variables first - before any imports
require("dotenv").config();

// Now import everything else
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

// Import Routes
const facultyRoutes = require("./routes/facultyRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const viewerRoutes = require("./routes/viewerRoutes");
const registrarRoutes = require("./routes/registrarRoutes");
const principalRoutes = require('./routes/principalRoutes');

const app = express();

// Verify environment variables are loaded
console.log("MongoDB URI:", process.env.MONGO_URI ? "URI is set" : "URI is MISSING");
console.log("JWT Secret:", process.env.JWT_SECRET ? "Secret is set" : "Secret is MISSING");

// Middleware
app.use(express.json());
app.use(cors({
  origin: "*", // Allow all origins - you can restrict this in production
  credentials: true
}));

// Simple status check route
app.get('/api/status', (req, res) => {
  const status = {
    server: 'running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  
  res.json(status);
});

// Simple diagnostic endpoint that doesn't require authentication
app.get('/api/simple-diagnostic', async (req, res) => {
  try {
    const leaveRequestCount = await mongoose.model('LeaveRequest').countDocuments();
    const userCount = await mongoose.model('User').countDocuments();
    
    res.json({
      success: true,
      data: {
        leaveRequests: leaveRequestCount,
        users: userCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Simple diagnostic error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/viewer", viewerRoutes);
app.use("/api/registrar", registrarRoutes);
app.use('/api/principal', principalRoutes);

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));