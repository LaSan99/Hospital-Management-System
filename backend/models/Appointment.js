const mongoose = require('mongoose');

// Simple Appointment Schema
const appointmentSchema = new mongoose.Schema({
  // Basic Information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Appointment Details
  appointmentDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  
  // Status and Type
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  appointmentType: {
    type: String,
    enum: ['consultation', 'follow_up', 'emergency', 'checkup'],
    required: true
  },
  
  // Appointment Information
  reason: {
    type: String,
    required: true
  },
  symptoms: [String],
  
  // Patient Information (cached for easy access)
  patientName: String,
  patientPhone: String,
  patientEmail: String,
  
  // Doctor Information (cached for easy access)
  doctorName: String,
  doctorSpecialization: String,
  
  // Location
  location: {
    type: String,
    enum: ['clinic', 'hospital', 'telemedicine'],
    default: 'clinic'
  },
  room: String,
  
  // Check-in
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: Date,
  
  // Payment
  consultationFee: Number,
  paymentStatus: {
    type: Boolean,
    default: false
  },
  paidAt: Date,
  
  // Notes
  notes: String
}, {
  timestamps: true
});

// Check if appointment time is available
appointmentSchema.statics.isTimeAvailable = async function(doctorId, date, startTime, endTime) {
  const conflict = await this.findOne({
    doctorId,
    appointmentDate: date,
    status: { $in: ['scheduled', 'confirmed'] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  });
  
  return !conflict;
};

// Cancel appointment
appointmentSchema.methods.cancel = function() {
  this.status = 'cancelled';
};

// Complete appointment
appointmentSchema.methods.complete = function() {
  this.status = 'completed';
};

// Check in patient
appointmentSchema.methods.checkIn = function() {
  this.checkedIn = true;
  this.checkedInAt = new Date();
  this.status = 'confirmed';
};

module.exports = mongoose.model('Appointment', appointmentSchema);
