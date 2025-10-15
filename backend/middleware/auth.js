const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Simple authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    next();
  };
};

// Check if user can access their own data or is admin/staff
const canAccessOwnData = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const userId = req.params.userId || req.params.patientId;
  
  // Admin and staff can access all data
  if (['admin', 'staff'].includes(req.user.role)) {
    return next();
  }

  // Users can only access their own data
  if (req.user._id.toString() === userId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied'
  });
};

module.exports = {
  authenticateToken,
  authorize,
  canAccessOwnData
};
