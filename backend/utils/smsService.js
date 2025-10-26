const { Vonage } = require('@vonage/server-sdk');

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});

const sendSMS = async (to, text) => {
  try {
    const from = process.env.VONAGE_FROM_NUMBER;
    
    await vonage.sms.send({ to, from, text });
    console.log(`✅ SMS sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ SMS Error:', error);
    return false;
  }
};

const sendOTP = async (phone, otp) => {
  const message = `Your OTP for Eswari Physiotherapy is: ${otp}. Valid for 5 minutes. Do not share this code.`;
  return await sendSMS(phone, message);
};

const sendBookingConfirmation = async (phone, date, timeSlot) => {
  const message = `Your appointment with Eswari Physiotherapy is confirmed for ${date} at ${timeSlot}. For more details, contact ${process.env.ADMIN_PHONE}`;
  return await sendSMS(phone, message);
};

const sendCancellationNotice = async (phone) => {
  const message = `Your appointment with Eswari Physiotherapy has been cancelled. For more details, contact ${process.env.ADMIN_PHONE}`;
  return await sendSMS(phone, message);
};

module.exports = {
  sendOTP,
  sendBookingConfirmation,
  sendCancellationNotice
};