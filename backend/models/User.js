const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["faculty", "admin", "viewer", "registrar", "principal"], default: "faculty" },
  employeeId: { type: String, required: function() { return !["viewer", "registrar", "principal"].includes(this.role); } },
  designation: { type: String, required: function() { return !["viewer", "registrar", "principal"].includes(this.role); } },
  department: { type: String, required: function() { return !["viewer", "registrar", "principal"].includes(this.role); } },
}, {
  timestamps: true
});

module.exports = mongoose.model("User", UserSchema);
