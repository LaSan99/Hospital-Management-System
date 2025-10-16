const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all medical records
router.get('/', authenticateToken, authorize('admin', 'staff', 'doctor'), async (req, res) => {
  try {
    let query = {};
    
    // Filter by doctor if not admin/staff
    if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    }

    const medicalRecords = await MedicalRecord.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        medicalRecords,
        count: medicalRecords.length
      }
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medical records',
      error: error.message
    });
  }
});

// Get medical records for a specific patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check authorization: patients can only access their own records
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own medical records.'
      });
    }
    
    const medicalRecords = await MedicalRecord.find({ patientId })
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        medicalRecords,
        count: medicalRecords.length
      }
    });
  } catch (error) {
    console.error('Get patient medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medical records',
      error: error.message
    });
  }
});

// Get single medical record
router.get('/:id', authenticateToken, authorize('admin', 'staff', 'doctor'), async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id)
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName specialization');
    
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check if doctor can access this record
    if (req.user.role === 'doctor' && medicalRecord.doctorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        medicalRecord
      }
    });
  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medical record',
      error: error.message
    });
  }
});

// Create new medical record
router.post('/', authenticateToken, authorize('admin', 'staff', 'doctor'), async (req, res) => {
  try {
    const { patientId, appointmentId, recordType, diagnosis, treatment, labResults, vitalSigns, followUp, doctorNotes, patientComplaints } = req.body;

    // Validate required fields
    if (!patientId || !recordType) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and record type are required'
      });
    }

    // Create medical record
    const medicalRecord = new MedicalRecord({
      patientId,
      doctorId: req.user._id,
      appointmentId,
      recordType,
      diagnosis,
      treatment,
      labResults,
      vitalSigns,
      followUp,
      doctorNotes,
      patientComplaints
    });

    await medicalRecord.save();

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: {
        medicalRecord
      }
    });
  } catch (error) {
  console.error('Create medical record error:', error); // 👈 This logs full error

  // Also log validation errors specifically
  if (error.name === 'ValidationError') {
    console.error('Validation errors:', error.errors);
  }

  res.status(500).json({
    success: false,
    message: 'Failed to create medical record',
    error: error.message,
    // Optional: send errors in dev (remove in production)
    // details: error.errors 
  });
}
});

// Update medical record
router.put('/:id', authenticateToken, authorize('admin', 'staff', 'doctor'), async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id);
    
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check if doctor can update this record
    if (req.user.role === 'doctor' && medicalRecord.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update allowed fields
    const allowedFields = ['diagnosis', 'treatment', 'labResults', 'vitalSigns', 'followUp', 'doctorNotes', 'patientComplaints'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        medicalRecord[field] = req.body[field];
      }
    });

    await medicalRecord.save();

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: {
        medicalRecord
      }
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medical record',
      error: error.message
    });
  }
});

// Complete medical record
router.put('/:id/complete', authenticateToken, authorize('admin', 'staff', 'doctor'), async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id);
    
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check if doctor can complete this record
    if (req.user.role === 'doctor' && medicalRecord.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    medicalRecord.completeRecord();
    await medicalRecord.save();

    res.json({
      success: true,
      message: 'Medical record completed successfully'
    });
  } catch (error) {
    console.error('Complete medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete medical record',
      error: error.message
    });
  }
});

// Add medication to treatment
router.post('/:id/medication', authenticateToken, authorize('admin', 'staff', 'doctor'), async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id);
    
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check if doctor can update this record
    if (req.user.role === 'doctor' && medicalRecord.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { name, dosage, frequency, duration, instructions } = req.body;
    
    if (!name || !dosage) {
      return res.status(400).json({
        success: false,
        message: 'Medication name and dosage are required'
      });
    }

    medicalRecord.addMedication({
      name,
      dosage,
      frequency,
      duration,
      instructions
    });

    await medicalRecord.save();

    res.json({
      success: true,
      message: 'Medication added successfully',
      data: {
        medicalRecord
      }
    });
  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add medication',
      error: error.message
    });
  }
});

// Add lab result
router.post('/:id/lab-result', authenticateToken, authorize('admin', 'staff', 'doctor'), async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id);
    
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check if doctor can update this record
    if (req.user.role === 'doctor' && medicalRecord.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { testName, result, normalRange, status } = req.body;
    
    if (!testName || !result) {
      return res.status(400).json({
        success: false,
        message: 'Test name and result are required'
      });
    }

    medicalRecord.addLabResult({
      testName,
      result,
      normalRange,
      status: status || 'normal',
      testDate: new Date()
    });

    await medicalRecord.save();

    res.json({
      success: true,
      message: 'Lab result added successfully',
      data: {
        medicalRecord
      }
    });
  } catch (error) {
    console.error('Add lab result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add lab result',
      error: error.message
    });
  }
});

module.exports = router;
