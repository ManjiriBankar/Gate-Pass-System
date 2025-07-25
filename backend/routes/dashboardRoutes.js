const express = require("express");
const { authMiddleware, adminMiddleware, facultyMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin Dashboard Route
router.get("/admin-dashboard", authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: "Welcome to Admin Dashboard" });
});

//Faculty Dashboard Route
router.get("/faculty-dashboard", authMiddleware, facultyMiddleware, (req, res) => {
  res.json({ message: "Welcome to Faculty Dashboard" });
});

// router.get("/faculty-dashboard", (req, res) => {
//     res.json({ message: "Welcome to Faculty Dashboard" });
//   });
module.exports = router;  // Ensure this line exists
