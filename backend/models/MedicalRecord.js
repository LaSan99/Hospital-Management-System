const mongoose = require('mongoose');

// Simple Medical Record Schema
const medicalRecordSchema = new mongoose.Schema({
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  
  // Record Details
  recordType: {
    type: String,
    enum: ['consultation', 'diagnosis', 'treatment', 'follow_up',"medicine"],
    required: true
  },
  
  // Diagnosis
  diagnosis: {
    mainProblem: String,
    symptoms: [String],
    notes: String
  },
  
  // Treatment
  treatment: {
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    procedures: [String],
    recommendations: [String]
  },
  
  // Lab Results
  labResults: [{
    testName: String,
    result: String,
    normalRange: String,
    status: String, // normal, abnormal, critical
    testDate: Date
  }],
  
  // Vital Signs
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number
  },
  
  // Follow-up
  followUp: {
    nextAppointment: Date,
    instructions: String,
    warningSigns: [String]
  },
  
  // Notes
  doctorNotes: String,
  patientComplaints: String,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'completed'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Add medication to treatment
medicalRecordSchema.methods.addMedication = function(medication) {
  this.treatment.medications.push(medication);
};

// Add lab result
medicalRecordSchema.methods.addLabResult = function(labResult) {
  this.labResults.push(labResult);
};

// Complete the record
medicalRecordSchema.methods.completeRecord = function() {
  this.status = 'completed';
};

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
