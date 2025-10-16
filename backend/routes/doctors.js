const express = require('express');
const User = require('../models/User');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all doctors...');
    
    const doctors = await User.find({ 
      role: 'doctor',
      isActive: true 
    })
    .select('-password')
    .sort({ specialization: 1 });

    console.log('Found doctors:', doctors.length);

    res.json({
      success: true,
      data: {
        doctors,
        count: doctors.length
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctors',
      error: error.message
    });
  }
});

// Get single doctor
router.get('/:id', async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id).select('-password');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'User is not a doctor'
      });
    }

    res.json({
      success: true,
      data: {
        doctor
      }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor',
      error: error.message
    });
  }
});

// Create new doctor (admin only)
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const doctorData = {
      ...req.body,
      role: 'doctor'
    };

    const doctor = new User(doctorData);
    await doctor.save();

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: {
        doctor: doctor.toJSON()
      }
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create doctor',
      error: error.message
    });
  }
});

// Update doctor
router.put('/:id', authenticateToken, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'User is not a doctor'
      });
    }

    // Check if user can update (admin or own profile)
    if (req.user.role !== 'admin' && req.user._id.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update allowed fields
    const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'specialization', 'licenseNumber', 'experience', 'consultationFee'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        doctor[field] = req.body[field];
      }
    });

    await doctor.save();

    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: {
        doctor: doctor.toJSON()
      }
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor',
      error: error.message
    });
  }
});

// Delete doctor (admin only)
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'User is not a doctor'
      });
    }

    // Soft delete - deactivate account
    doctor.isActive = false;
    await doctor.save();

    res.json({
      success: true,
      message: 'Doctor deactivated successfully'
    });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor',
      error: error.message
    });
  }
});

// Update doctor availability (toggle isActive status)
router.put('/:id/availability', authenticateToken, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'User is not a doctor'
      });
    }

    // Check if user can update (own availability or admin)
    if (req.user.role !== 'admin' && req.user._id.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update availability status (not account status)
    doctor.isAvailable = req.body.isAvailable;
    await doctor.save();

    res.json({
      success: true,
      message: `Availability ${doctor.isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: {
        isAvailable: doctor.isAvailable
      }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
});

// Get doctors by specialization
router.get('/specialization/:specialization', async (req, res) => {
  try {
    const { specialization } = req.params;
    
    const doctors = await User.find({ 
      role: 'doctor',
      specialization: new RegExp(specialization, 'i'),
      isActive: true 
    })
    .select('-password')
    .sort({ experience: -1 });

    res.json({
      success: true,
      data: {
        doctors,
        count: doctors.length
      }
    });
  } catch (error) {
    console.error('Get doctors by specialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctors',
      error: error.message
    });
  }
});

module.exports = router;
