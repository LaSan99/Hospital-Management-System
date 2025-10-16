const mongoose = require('mongoose');

const healthCardRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: String,
  patientEmail: String,
  patientPhone: String,
  
  // Request Details
  bloodType: String,
  allergies: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  // Request Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Admin Response
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  rejectionReason: String,
  
  // Issued Card Reference
  healthCardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthCard'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HealthCardRequest', healthCardRequestSchema);
