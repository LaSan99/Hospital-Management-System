const express = require('express');
const HealthCard = require('../models/HealthCard');
const HealthCardRequest = require('../models/HealthCardRequest');
const User = require('../models/User');
const { authenticateToken, authorize, canAccessOwnData } = require('../middleware/auth');

const router = express.Router();

// Get all health cards (admin/staff only)
router.get('/', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
  try {
    const healthCards = await HealthCard.find()
      .populate('patientId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        healthCards,
        count: healthCards.length
      }
    });
  } catch (error) {
    console.error('Get health cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health cards',
      error: error.message
    });
  }
});

// ===== HEALTH CARD REQUEST ROUTES (Must be before /:id route) =====

// Get all health card requests (admin/staff only)
router.get('/requests', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
  try {
    const requests = await HealthCardRequest.find()
      .populate('patientId', 'firstName lastName email phone')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        requests,
        count: requests.length
      }
    });
  } catch (error) {
    console.error('Get health card requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health card requests',
      error: error.message
    });
  }
});

// Get patient's own health card request
router.get('/request/my-request', authenticateToken, authorize('patient'), async (req, res) => {
  try {
    const request = await HealthCardRequest.findOne({ patientId: req.user._id })
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { request }
    });
  } catch (error) {
    console.error('Get my health card request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health card request',
      error: error.message
    });
  }
});

// Validate health card
router.get('/validate/:cardNumber', async (req, res) => {
  try {
    const { cardNumber } = req.params;
    
    const healthCard = await HealthCard.findOne({ cardNumber })
      .populate('patientId', 'firstName lastName email phone');
    
    if (!healthCard) {
      return res.status(404).json({
        success: false,
        message: 'Health card not found'
      });
    }

    const isValid = healthCard.isValid();

    res.json({
      success: true,
      data: {
        healthCard: isValid ? healthCard : null,
        isValid,
        message: isValid ? 'Health card is valid' : 'Health card is invalid or expired'
      }
    });
  } catch (error) {
    console.error('Validate health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate health card',
      error: error.message
    });
  }
});

// Get health card by card number
router.get('/card/:cardNumber', async (req, res) => {
  try {
    const { cardNumber } = req.params;
    
    const healthCard = await HealthCard.findOne({ cardNumber })
      .populate('patientId', 'firstName lastName email phone');
    
    if (!healthCard) {
      return res.status(404).json({
        success: false,
        message: 'Health card not found'
      });
    }

    res.json({
      success: true,
      data: {
        healthCard
      }
    });
  } catch (error) {
    console.error('Get health card by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health card',
      error: error.message
    });
  }
});

// Get health card by patient ID
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching health card for patient:', req.params.patientId);
    console.log('Requested by user:', req.user._id, 'Role:', req.user.role);
    
    // Check authorization: patients can only access their own cards
    if (req.user.role === 'patient' && req.user._id.toString() !== req.params.patientId) {
      console.log('Access denied: Patient trying to access another patient\'s card');
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own health card.'
      });
    }
    
    const healthCard = await HealthCard.findOne({ patientId: req.params.patientId })
      .populate('patientId', 'firstName lastName email phone');
    
    console.log('Health card found:', healthCard ? healthCard.cardNumber : 'null');
    
    if (!healthCard) {
      return res.status(404).json({
        success: false,
        message: 'Health card not found'
      });
    }

    res.json({
      success: true,
      data: {
        healthCard
      }
    });
  } catch (error) {
    console.error('Get patient health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health card',
      error: error.message
    });
  }
});

// Get health card by ID (Must be after specific routes)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const healthCard = await HealthCard.findById(req.params.id)
      .populate('patientId', 'firstName lastName email phone');
    
    if (!healthCard) {
      return res.status(404).json({
        success: false,
        message: 'Health card not found'
      });
    }

    // Check access permissions
    const canAccess = req.user.role === 'admin' || 
                     req.user.role === 'staff' ||
                     healthCard.patientId._id.toString() === req.user._id.toString();

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        healthCard
      }
    });
  } catch (error) {
    console.error('Get health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health card',
      error: error.message
    });
  }
});

// Create new health card
router.post('/', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
  try {
    console.log('Creating health card with data:', req.body);
    const { patientId, expiryDate, bloodType, allergies, emergencyContact } = req.body;

    // Validate required fields
    if (!patientId || !expiryDate) {
      console.log('Validation failed: missing patientId or expiryDate');
      return res.status(400).json({
        success: false,
        message: 'Patient ID and expiry date are required'
      });
    }

    // Check if patient exists
    console.log('Looking up patient with ID:', patientId);
    const patient = await User.findById(patientId);
    console.log('Patient found:', patient ? `${patient.firstName} ${patient.lastName}` : 'null');
    
    if (!patient || patient.role !== 'patient') {
      console.log('Patient validation failed. Patient exists:', !!patient, 'Role:', patient?.role);
      return res.status(400).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if patient already has a health card
    const existingCard = await HealthCard.findOne({ patientId });
    if (existingCard) {
      console.log('Patient already has a health card:', existingCard.cardNumber);
      return res.status(400).json({
        success: false,
        message: 'Patient already has a health card'
      });
    }

    // Create health card
    console.log('Creating health card object...');
    const healthCard = new HealthCard({
      patientId,
      expiryDate,
      patientName: patient.getFullName(),
      patientEmail: patient.email,
      patientPhone: patient.phone,
      bloodType: bloodType || patient.bloodType,
      allergies: allergies || patient.allergies || [],
      emergencyContact: emergencyContact || patient.emergencyContact || {}
    });

    console.log('Saving health card...');
    await healthCard.save();
    console.log('Health card saved successfully:', healthCard.cardNumber);

    res.status(201).json({
      success: true,
      message: 'Health card created successfully',
      data: {
        healthCard
      }
    });
  } catch (error) {
    console.error('Create health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create health card',
      error: error.message
    });
  }
});

// Update health card
router.put('/:id', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
  try {
    const healthCard = await HealthCard.findById(req.params.id);
    
    if (!healthCard) {
      return res.status(404).json({
        success: false,
        message: 'Health card not found'
      });
    }

    // Update allowed fields
    const allowedFields = ['expiryDate', 'bloodType', 'allergies', 'emergencyContact'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        healthCard[field] = req.body[field];
      }
    });

    await healthCard.save();

    res.json({
      success: true,
      message: 'Health card updated successfully',
      data: {
        healthCard
      }
    });
  } catch (error) {
    console.error('Update health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update health card',
      error: error.message
    });
  }
});

// Block health card
router.put('/:id/block', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { reason } = req.body;
    const healthCard = await HealthCard.findById(req.params.id);
    
    if (!healthCard) {
      return res.status(404).json({
        success: false,
        message: 'Health card not found'
      });
    }

    healthCard.blockCard(reason || 'Blocked by admin');
    await healthCard.save();

    res.json({
      success: true,
      message: 'Health card blocked successfully'
    });
  } catch (error) {
    console.error('Block health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block health card',
      error: error.message
    });
  }
});

// Unblock health card
router.put('/:id/unblock', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
  try {
    const healthCard = await HealthCard.findById(req.params.id);
    
    if (!healthCard) {
      return res.status(404).json({
        success: false,
        message: 'Health card not found'
      });
    }

    healthCard.isBlocked = false;
    healthCard.blockReason = null;
    healthCard.status = 'active';
    await healthCard.save();

    res.json({
      success: true,
      message: 'Health card unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock health card',
      error: error.message
    });
  }
});

// Create health card request (patient only)
router.post('/request', authenticateToken, authorize('patient'), async (req, res) => {
  try {
    const { bloodType, allergies, emergencyContact } = req.body;

    // Check if patient already has a health card
    const existingCard = await HealthCard.findOne({ patientId: req.user._id });
    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: 'You already have a health card'
      });
    }

    // Check if patient already has a pending request
    const existingRequest = await HealthCardRequest.findOne({ 
      patientId: req.user._id,
      status: 'pending'
    });
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending health card request'
      });
    }

    // Create health card request
    const request = new HealthCardRequest({
      patientId: req.user._id,
      patientName: req.user.getFullName(),
      patientEmail: req.user.email,
      patientPhone: req.user.phone,
      bloodType,
      allergies: allergies || [],
      emergencyContact: emergencyContact || {}
    });

    await request.save();

    res.status(201).json({
      success: true,
      message: 'Health card request submitted successfully',
      data: { request }
    });
  } catch (error) {
    console.error('Create health card request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit health card request',
      error: error.message
    });
  }
});

// Approve health card request (admin/staff only)
router.put('/request/:id/approve', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { expiryDate } = req.body;

    if (!expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date is required'
      });
    }

    const request = await HealthCardRequest.findById(req.params.id)
      .populate('patientId', 'firstName lastName email phone');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Health card request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Create health card
    const healthCard = new HealthCard({
      patientId: request.patientId._id,
      expiryDate,
      patientName: request.patientName,
      patientEmail: request.patientEmail,
      patientPhone: request.patientPhone,
      bloodType: request.bloodType,
      allergies: request.allergies,
      emergencyContact: request.emergencyContact
    });

    await healthCard.save();

    // Update request status
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.healthCardId = healthCard._id;
    await request.save();

    res.json({
      success: true,
      message: 'Health card request approved and card issued',
      data: { healthCard, request }
    });
  } catch (error) {
    console.error('Approve health card request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve health card request',
      error: error.message
    });
  }
});

// Reject health card request (admin/staff only)
router.put('/request/:id/reject', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const request = await HealthCardRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Health card request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason || 'No reason provided';
    await request.save();

    res.json({
      success: true,
      message: 'Health card request rejected',
      data: { request }
    });
  } catch (error) {
    console.error('Reject health card request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject health card request',
      error: error.message
    });
  }
});

module.exports = router;
