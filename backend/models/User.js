const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Simple User Schema - Easy to understand
const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'doctor', 'staff', 'patient']
  },
  phone: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Doctor Information (only for doctors)
  specialization: String,
  licenseNumber: String,
  experience: Number,
  consultationFee: Number,
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Patient Information (only for patients)
  bloodType: String,
  allergies: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Before saving user, hash the password
userSchema.pre('save', async function(next) {
  // Only hash password if it's new or modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Hash password with salt
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password is correct
userSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method to get full name
userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Don't send password in response
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
