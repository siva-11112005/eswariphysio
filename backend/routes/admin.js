const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');
const { sendBookingConfirmation, sendCancellationNotice } = require('../utils/smsService');

// Get all appointments
router.get('/appointments', adminAuth, async (req, res) => {
  try {
    const { date, status } = req.query;
    let query = {};
    
    if (date) {
      const selectedDate = new Date(date);
      query.date = {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
      };
    }
    
    if (status) {
      query.status = status;
    }
    
    const appointments = await Appointment.find(query)
      .sort({ date: 1, timeSlot: 1 })
      .populate('user', 'name phone isBlocked');
    
    res.json({ appointments });
  } catch (error) {
    console.error('Get All Appointments Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
router.patch('/appointments/:id', adminAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const appointment = await Appointment.findById(req.params.id)
      .populate('user', 'phone');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    const oldStatus = appointment.status;
    appointment.status = status;
    if (notes) appointment.notes = notes;
    await appointment.save();
    
    // Send SMS notification
    if (status === 'confirmed' && oldStatus === 'pending') {
      const formattedDate = appointment.date.toLocaleDateString('en-IN');
      await sendBookingConfirmation(appointment.user.phone, formattedDate, appointment.timeSlot);
    } else if (status === 'cancelled') {
      await sendCancellationNotice(appointment.user.phone);
    }
    
    res.json({ message: 'Appointment updated successfully', appointment });
  } catch (error) {
    console.error('Update Appointment Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block/Unblock user
router.patch('/users/:id/block', adminAuth, async (req, res) => {
  try {
    const { isBlocked } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isAdmin) {
      return res.status(400).json({ message: 'Cannot block admin' });
    }
    
    user.isBlocked = isBlocked;
    await user.save();
    
    // Cancel all pending/confirmed appointments if blocking
    if (isBlocked) {
      await Appointment.updateMany(
        { user: user._id, status: { $in: ['pending', 'confirmed'] } },
        { status: 'cancelled' }
      );
      
      await sendCancellationNotice(user.phone);
    }
    
    res.json({ 
      message: isBlocked ? 'User blocked successfully' : 'User unblocked successfully',
      user 
    });
  } catch (error) {
    console.error('Block User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const todayAppointments = await Appointment.countDocuments({
      date: { $gte: today },
      status: { $in: ['pending', 'confirmed'] }
    });
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const totalAppointments = await Appointment.countDocuments();
    
    res.json({
      totalUsers,
      todayAppointments,
      pendingAppointments,
      totalAppointments
    });
  } catch (error) {
    console.error('Get Stats Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;