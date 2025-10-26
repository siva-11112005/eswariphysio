const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { generateTimeSlots } = require('../utils/timeSlots');
const { sendBookingConfirmation } = require('../utils/smsService');

// Get available time slots for a date
router.get('/slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const selectedDate = new Date(date);
    
    // Check if it's Sunday
    if (selectedDate.getDay() === 0) {
      return res.json({ slots: [] });
    }
    
    // Get all time slots
    const allSlots = generateTimeSlots();
    
    // Get booked slots for this date
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const bookedAppointments = await Appointment.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: { $in: ['pending', 'confirmed'] }
    });
    
    const bookedSlots = bookedAppointments.map(apt => apt.timeSlot);
    
    // Mark slots as available or booked
    const slots = allSlots.map(slot => ({
      time: slot,
      isBooked: bookedSlots.includes(slot)
    }));
    
    res.json({ slots });
  } catch (error) {
    console.error('Get Slots Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Book appointment
router.post('/book', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin cannot book appointments' });
    }
    
    const { date, timeSlot, painType, reason, phone, email } = req.body;
    
    // Validate required fields
    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'Date and time slot are required' });
    }
    
    // Check if the date is valid (not in the past)
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      return res.status(400).json({ message: 'Cannot book appointments in the past' });
    }
    
    // Check if it's Sunday
    if (appointmentDate.getDay() === 0) {
      return res.status(400).json({ message: 'Clinic is closed on Sundays' });
    }
    
    // Check if slot is already booked
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingAppointment = await Appointment.findOne({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (existingAppointment) {
      return res.status(400).json({ message: 'This slot is already booked' });
    }
    
    // Create appointment
    const appointment = await Appointment.create({
      user: req.user._id,
      date: appointmentDate,
      timeSlot,
      painType: painType || '',
      reason: reason || '',
      status: 'pending'
    });
    
    // Send confirmation SMS
    const userPhone = phone || req.user.phone;
    const formattedDate = appointmentDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    await sendBookingConfirmation(userPhone, formattedDate, timeSlot);
    
    res.status(201).json({ 
      message: 'Appointment booked successfully',
      appointment 
    });
  } catch (error) {
    console.error('Book Appointment Error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This slot is already booked' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's appointments
router.get('/my-appointments', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .sort({ date: -1, timeSlot: 1 })
      .populate('user', 'name phone email');
    
    res.json({ appointments });
  } catch (error) {
    console.error('Get Appointments Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user owns this appointment or is admin
    if (appointment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Don't allow cancellation of already cancelled or completed appointments
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }
    
    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed appointment' });
    }
    
    appointment.status = 'cancelled';
    await appointment.save();
    
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel Appointment Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;