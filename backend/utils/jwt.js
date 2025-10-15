const jwt = require('jsonwebtoken');

// Generate JWT token for user login
const generateToken = (userId, role) => {
  const payload = {
    userId,
    role
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  verifyToken
};
