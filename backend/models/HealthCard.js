const mongoose = require('mongoose');

// Simple Health Card Schema
const healthCardSchema = new mongoose.Schema({
  // Basic Card Information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cardNumber: {
    type: String,
    unique: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'blocked'],
    default: 'active'
  },
  
  // Patient Information on Card
  patientName: String,
  patientEmail: String,
  patientPhone: String,
  bloodType: String,
  allergies: [String],
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  // Card Security
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: String
}, {
  timestamps: true
});

// Before saving, generate card number if not provided
healthCardSchema.pre('save', async function(next) {
  if (this.isNew && !this.cardNumber) {
    // Generate simple card number
    const count = await this.constructor.countDocuments();
    this.cardNumber = `HC${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Check if card is valid
healthCardSchema.methods.isValid = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.expiryDate > now && 
         !this.isBlocked;
};

// Block the card
healthCardSchema.methods.blockCard = function(reason) {
  this.isBlocked = true;
  this.blockReason = reason;
  this.status = 'blocked';
};

module.exports = mongoose.model('HealthCard', healthCardSchema);
