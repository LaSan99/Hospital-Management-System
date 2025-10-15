const mongoose = require('mongoose');

// Simple Notification Schema
const notificationSchema = new mongoose.Schema({
  // Basic Information
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Notification Content
  type: {
    type: String,
    enum: [
      'appointment_booking',
      'appointment_reminder',
      'appointment_cancelled',
      'health_card_issued',
      'medical_record_updated',
      'payment_confirmation',
      'system_announcement'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Related Information
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  relatedType: {
    type: String,
    enum: ['appointment', 'health_card', 'medical_record', 'payment']
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
};

// Mark as sent
notificationSchema.methods.markAsSent = function() {
  this.status = 'sent';
};

// Get unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipientId: userId,
    read: false
  });
};

// Mark all as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipientId: userId, read: false },
    { 
      $set: { 
        read: true, 
        readAt: new Date() 
      } 
    }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
