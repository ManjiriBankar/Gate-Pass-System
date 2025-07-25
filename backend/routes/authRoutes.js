const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

// Registrar middleware to check if user is registrar
const registrarMiddleware = (req, res, next) => {
  if (req.user.role !== 'registrar') {
    return res.status(403).json({ message: "Not authorized as registrar" });
  }
  next();
};

//REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, employeeId, designation, department } = req.body;

    // Validate role
    if (!["admin", "faculty", "viewer", "registrar", "principal"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'admin', 'faculty', 'viewer', 'registrar', or 'principal'." });
    }

    // Enforce only one principal
    if (role === "principal") {
      const existingPrincipal = await User.findOne({ role: "principal" });
      if (existingPrincipal) {
        return res.status(400).json({ message: "Principal Already Exists" });
      }
    }
    // Enforce only one registrar
    if (role === "registrar") {
      const existingRegistrar = await User.findOne({ role: "registrar" });
      if (existingRegistrar) {
        return res.status(400).json({ message: "Registrar Already Exists" });
      }
    }
    // Enforce only one admin per department
    if (role === "admin") {
      const existingAdmin = await User.findOne({ role: "admin", department: department });
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin already Exists" });
      }
    }
    // Enforce only one "Head Of Department" per department
    if (role === "faculty" && designation === "Head Of Department") {
      const existingHOD = await User.findOne({ 
        role: "faculty", 
        designation: { $in: ["HOD", "Head Of Department"] }, 
        department: department 
      });
      if (existingHOD) {
        return res.status(400).json({ message: "User Already Exists" });
      }
    }
    // Enforce only one "HOD" per department
    if (role === "faculty" && designation === "HOD") {
      const existingHOD = await User.findOne({ 
        role: "faculty", 
        designation: { $in: ["HOD", "Head Of Department"] }, 
        department: department 
      });
      if (existingHOD) {
        return res.status(400).json({ message: "User Already Exists" });
      }
    }

    // HOD/Admin registration: email must start with 'hod.'
    if (role === 'admin' && !/^hod\.[a-z]+@kbtcoe\.org$/i.test(email)) {
      return res.status(400).json({ message: "To register as Admin (HOD), email must be in the format hod.branch@kbtcoe.org" });
    }

    // Validate email format (lastname.firstname@kbtcoe.org or hod.xyz@kbtcoe.org for admin)
    const emailRegex = role === 'admin'
      ? /^hod\.[a-z]+@kbtcoe\.org$/i
      : /^[a-z]+\.[a-z]+@kbtcoe\.org$/i;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: role === 'admin' ? "Admin email must be in format: hod.branch@kbtcoe.org" : "Email must be in format: lastname.firstname@kbtcoe.org" });
    }

    // Validate required fields based on role
    if (!['viewer', 'registrar', 'principal'].includes(role) && (!employeeId || !designation || !department)) {
      return res.status(400).json({ 
        message: "Employee ID, designation, and department are required for faculty and admin registration." 
      });
    }

    // Prevent duplicate emails for all roles
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User with this email already exists" });

    // Check if employee ID is unique (only for non-viewer roles)
    if (role !== 'viewer' && employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({ message: "Employee ID already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data based on role
    const userData = { 
      name, 
      email, 
      password: hashedPassword, 
      role
    };
    
    // Add additional fields only for faculty and admin roles
    if (!['viewer', 'registrar', 'principal'].includes(role)) {
      userData.employeeId = employeeId;
      userData.designation = designation;
      userData.department = department;
    } else {
      // Set default values for viewer, registrar, and principal roles to satisfy schema requirements
      userData.employeeId = 'N/A';
      userData.designation = role.charAt(0).toUpperCase() + role.slice(1);
      userData.department = role === 'viewer' ? 'Security' : (role === 'registrar' ? 'Registrar' : 'Principal');
    }
    
    const user = new User(userData);
    await user.save();

    res.status(201).json({ message: `${role} Registered Successfully`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email format (lastname.firstname@kbtcoe.org)
    const emailRegex = /^[a-z]+\.[a-z]+@kbtcoe\.org$/i;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email must be in format: lastname.firstname@kbtcoe.org" });
    }
    
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Prepare user data to send back
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      designation: user.designation,
      department: user.department
    };

    // Determine the correct redirect URL based on user role
    let redirectUrl;
    if (user.role === "admin") {
      redirectUrl = "/admin-dashboard";
    } else if (user.role === "faculty") {
      redirectUrl = "/faculty-dashboard";
    } else if (user.role === "viewer") {
      redirectUrl = "/viewer-dashboard";
    } else {
      redirectUrl = "/dashboard";
    }

    res.json({
      token,
      user: userData,
      redirectUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGOUT (Clearing Token)
router.post("/logout", async (req, res) => {
  try {
    res.json({ message: "Logged Out Successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, employeeId, newPassword } = req.body;
    if (!email || !employeeId || !newPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const user = await User.findOne({ email, employeeId });
    if (!user) {
      return res.status(404).json({ message: 'No user found with provided email and employee ID.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password.', error: err.message });
  }
});

module.exports = router;
