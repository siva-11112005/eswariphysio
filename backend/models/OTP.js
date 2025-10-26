const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    match: /^(\+91)[6-9]\d{9}$/
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['registration', 'password_reset'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Auto delete after 5 minutes
  }
});

// Index for faster queries
OTPSchema.index({ phone: 1, createdAt: 1 });

module.exports = mongoose.model('OTP', OTPSchema);