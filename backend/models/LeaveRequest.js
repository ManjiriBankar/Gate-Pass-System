const mongoose = require("mongoose");

const LeaveRequestSchema = new mongoose.Schema({
  facultyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  },
  facultyEmail: { 
    type: String, 
    required: true,
    index: true 
  },
  date: { 
    type: String, 
    required: true,
    index: true 
  },
  timeIn: { type: String, required: true },
  timeOut: { type: String, required: true },
  purpose: { type: String, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "registrar_approved", "registrar_rejected", "pending_emergency_allowed"], 
    default: "pending",
    index: true 
  },
  statusDetail: {
    type: String,
    default: '',
  },
  hodStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  registrarStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  allowed: {
    type: Boolean,
    default: false,
    index: true
  },
  allowedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  allowedAt: {
    type: Date,
    default: null
  },
  returned: {
    type: Boolean,
    default: false,
    index: true
  },
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  returnedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

LeaveRequestSchema.index({ 
  facultyEmail: 'text', 
  purpose: 'text', 
  reason: 'text' 
});

const LeaveRequest = mongoose.model("LeaveRequest", LeaveRequestSchema);
module.exports = LeaveRequest;
