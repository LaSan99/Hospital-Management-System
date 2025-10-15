const express = require('express');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .populate('senderId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        notifications,
        count: notifications.length
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
});

// Get unread notifications count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    notification.markAsRead();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// Create notification (admin/staff only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { recipientId, type, title, message, relatedId, relatedType, priority } = req.body;

    // Validate required fields
    if (!recipientId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID, type, title, and message are required'
      });
    }

    // Create notification
    const notification = new Notification({
      recipientId,
      senderId: req.user._id,
      type,
      title,
      message,
      relatedId,
      relatedType,
      priority: priority || 'medium'
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: {
        notification
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// Get notifications by type
router.get('/type/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    const notifications = await Notification.find({ 
      recipientId: req.user._id,
      type 
    })
    .populate('senderId', 'firstName lastName')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        notifications,
        count: notifications.length
      }
    });
  } catch (error) {
    console.error('Get notifications by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
});

module.exports = router;
