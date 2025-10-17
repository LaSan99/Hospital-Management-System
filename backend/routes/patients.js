const express = require('express');
const User = require('../models/User');
const HealthCard = require('../models/HealthCard');
const { authenticateToken, authorize, canAccessOwnData } = require('../middleware/auth');

const router = express.Router();

// Get all patients (admin/staff only)
router.get('/', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
  try {
    console.log('Fetching all patients. Requested by:', req.user.email, 'Role:', req.user.role);
    
    const patients = await User.find({ role: 'patient' })
      .select('-password')
      .sort({ createdAt: -1 });

    console.log('Found patients:', patients.length);

    res.json({
      success: true,
      data: {
        patients,
        count: patients.length
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patients',
      error: error.message
    });
  }
});

// Get single patient
router.get('/:id', authenticateToken, canAccessOwnData, async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select('-password');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (patient.role !== 'patient') {
      return res.status(400).json({
        success: false,
        message: 'User is not a patient'
      });
    }

    res.json({
      success: true,
      data: {
        patient
      }
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient',
      error: error.message
    });
  }
});

// Create new patient (admin/staff only)
router.post('/', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
  try {
    const patientData = {
      ...req.body,
      role: 'patient'
    };

    const patient = new User(patientData);
    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: {
        patient: patient.toJSON()
      }
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create patient',
      error: error.message
    });
  }
});

// Update patient
router.put('/:id', authenticateToken, canAccessOwnData, async (req, res) => {
  try {
    const patient = await User.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (patient.role !== 'patient') {
      return res.status(400).json({
        success: false,
        message: 'User is not a patient'
      });
    }

    // Update allowed fields
    const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'bloodType', 'allergies', 'emergencyContact'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        patient[field] = req.body[field];
      }
    });

    await patient.save();

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: {
        patient: patient.toJSON()
      }
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient',
      error: error.message
    });
  }
});

// Delete patient (admin only)
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const patient = await User.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (patient.role !== 'patient') {
      return res.status(400).json({
        success: false,
        message: 'User is not a patient'
      });
    }

    // Soft delete - deactivate account
    patient.isActive = false;
    await patient.save();

    res.json({
      success: true,
      message: 'Patient deactivated successfully'
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient',
      error: error.message
    });
  }
});

// Permanent delete patient (admin only)
router.delete('/:id/permanent', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const patient = await User.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (patient.role !== 'patient') {
      return res.status(400).json({
        success: false,
        message: 'User is not a patient'
      });
    }

    // Delete associated health card if exists
    await HealthCard.deleteOne({ patientId: req.params.id });

    // Permanent delete - remove from database
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Patient permanently deleted successfully'
    });
  } catch (error) {
    console.error('Permanent delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete patient',
      error: error.message
    });
  }
});

// Get patient's health card
router.get('/:id/health-card', authenticateToken, canAccessOwnData, async (req, res) => {
  try {
    const healthCard = await HealthCard.findOne({ patientId: req.params.id });
    
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
    console.error('Get health card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health card',
      error: error.message
    });
  }
});

module.exports = router;
