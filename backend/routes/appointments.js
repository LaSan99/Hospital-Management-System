const express = require('express');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { authenticateToken, authorize, canAccessOwnData } = require('../middleware/auth');

const router = express.Router();

// Get all appointments
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    // Filter by user role
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    }
    // Admin and staff can see all appointments

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ appointmentDate: -1 });

    res.json({
      success: true,
      data: {
        appointments,
        count: appointments.length
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
});

// Get single appointment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName specialization');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check access permissions
    const canAccess = req.user.role === 'admin' || 
                     req.user.role === 'staff' ||
                     appointment.patientId._id.toString() === req.user._id.toString() ||
                     appointment.doctorId._id.toString() === req.user._id.toString();

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment',
      error: error.message
    });
  }
});

// Create new appointment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { doctorId, appointmentDate, startTime, endTime, appointmentType, reason, symptoms } = req.body;

    // Validate required fields
    if (!doctorId || !appointmentDate || !startTime || !endTime || !appointmentType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if time slot is available
    const isAvailable = await Appointment.isTimeAvailable(doctorId, appointmentDate, startTime, endTime);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is not available'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: req.user._id,
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      appointmentType,
      reason,
      symptoms,
      patientName: req.user.getFullName(),
      patientPhone: req.user.phone,
      patientEmail: req.user.email,
      doctorName: doctor.getFullName(),
      doctorSpecialization: doctor.specialization,
      consultationFee: doctor.consultationFee
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
});

// Update appointment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions
    const canUpdate = req.user.role === 'admin' || 
                     req.user.role === 'staff' ||
                     appointment.patientId.toString() === req.user._id.toString() ||
                     appointment.doctorId.toString() === req.user._id.toString();

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update allowed fields
    const allowedFields = ['appointmentDate', 'startTime', 'endTime', 'reason', 'symptoms', 'notes', 'status'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        appointment[field] = req.body[field];
      }
    });

    await appointment.save();
    
    console.log(`Appointment ${req.params.id} updated. New status: ${appointment.status}`);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
});

// Cancel appointment
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions
    const canCancel = req.user.role === 'admin' || 
                     req.user.role === 'staff' ||
                     appointment.patientId.toString() === req.user._id.toString();

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    appointment.cancel();
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
});

// Check in patient
router.put('/:id/checkin', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.checkIn();
    await appointment.save();

    res.json({
      success: true,
      message: 'Patient checked in successfully'
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in patient',
      error: error.message
    });
  }
});

// Process payment for appointment
router.put('/:id/payment', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions - only patient can pay for their appointment
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if already paid
    if (appointment.paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    // Update payment status
    appointment.paymentStatus = true;
    appointment.paidAt = new Date();
    await appointment.save();

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
});

// Delete appointment (only for cancelled appointments)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions - only patient can delete their own cancelled appointments
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only allow deletion of cancelled appointments
    if (appointment.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled appointments can be deleted'
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment',
      error: error.message
    });
  }
});

// Get available time slots for a doctor
router.get('/availability/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Get doctor's appointments for the date
    const appointments = await Appointment.find({
      doctorId,
      appointmentDate: new Date(date),
      status: { $in: ['scheduled', 'confirmed'] }
    }).select('startTime endTime');

    // Generate available time slots
    // CONFIGURATION:
    // - Change startHour/endHour to modify working hours (24-hour format)
    // - Change slotDuration to modify appointment length (in minutes)
    // - Add lunch break logic if needed
    const availableSlots = [];
    const startHour = 9;        // Start time: 9 AM
    const endHour = 17;         // End time: 5 PM (17:00)
    const slotDuration = 30;    // Slot duration in minutes
    const lunchStart = 13;      // Lunch break start (1 PM)
    const lunchEnd = 14;        // Lunch break end (2 PM)
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        // Skip lunch break (optional - comment out if not needed)
        if (hour >= lunchStart && hour < lunchEnd) {
          continue;
        }

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Calculate end time dynamically based on slot duration
        const totalMinutes = hour * 60 + minute + slotDuration;
        const endHourCalc = Math.floor(totalMinutes / 60);
        const endMinuteCalc = totalMinutes % 60;
        const endTimeString = `${endHourCalc.toString().padStart(2, '0')}:${endMinuteCalc.toString().padStart(2, '0')}`;

        // Don't create slots that end after working hours
        if (endHourCalc > endHour) {
          continue;
        }

        // Check if this slot is available
        const isBooked = appointments.some(apt => 
          apt.startTime <= timeString && apt.endTime > timeString
        );

        if (!isBooked) {
          availableSlots.push({
            startTime: timeString,
            endTime: endTimeString
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        availableSlots,
        count: availableSlots.length
      }
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get availability',
      error: error.message
    });
  }
});

module.exports = router;
