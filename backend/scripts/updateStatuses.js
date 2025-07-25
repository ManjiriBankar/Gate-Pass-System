const mongoose = require('mongoose');
const LeaveRequest = require('../models/LeaveRequest');

const MONGO_URI = 'mongodb://localhost:27017/gatepass'; // Change this to your DB name

async function updateStatuses() {
  await mongoose.connect(MONGO_URI);

  const requests = await LeaveRequest.find({});
  for (const req of requests) {
    // Set HOD status
    if (req.status === 'approved') {
      req.hodStatus = 'approved';
      req.registrarStatus = 'pending';
    } else if (req.status === 'rejected') {
      req.hodStatus = 'rejected';
      req.registrarStatus = 'pending';
    } else if (req.status === 'registrar_approved') {
      req.hodStatus = 'approved';
      req.registrarStatus = 'approved';
    } else if (req.status === 'registrar_rejected') {
      req.hodStatus = 'approved';
      req.registrarStatus = 'rejected';
    } else {
      req.hodStatus = 'pending';
      req.registrarStatus = 'pending';
    }
    await req.save();
  }
  console.log('Statuses updated!');
  mongoose.disconnect();
}

updateStatuses(); 