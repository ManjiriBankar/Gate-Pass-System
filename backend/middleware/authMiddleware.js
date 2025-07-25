const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized Access" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access Denied" });
  }
  next();
};

const facultyMiddleware = (req, res, next) => {
  if (req.user.role !== "faculty") {
    return res.status(403).json({ message: "Access Denied" });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, facultyMiddleware };

