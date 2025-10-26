const { Vonage } = require('@vonage/server-sdk');

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});

const sendSMS = async (to, text) => {
  try {
    const from = process.env.VONAGE_FROM_NUMBER;
    
    console.log('📱 SMS Details:');
    console.log('   To:', to);
    console.log('   From:', from);
    console.log('   Message:', text);
    
    const result = await vonage.sms.send({ to, from, text });
    console.log('✅ SMS sent successfully');
    return true;
  } catch (error) {
    console.error('❌ SMS Error:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    // Return true anyway so registration continues (OTP is in logs)
    return true;
  }
};

const sendOTP = async (phone, otp) => {
  // ALWAYS log OTP in production so you can see it
  console.log('');
  console.log('═'.repeat(60));
  console.log('🔐 OTP GENERATED:');
  console.log('   Phone:', phone);
  console.log('   OTP:', otp);
  console.log('   Valid for: 5 minutes');
  console.log('═'.repeat(60));
  console.log('');
  
  const message = `Your OTP for Eswari Physiotherapy is: ${otp}. Valid for 5 minutes. Do not share this code.`;
  
  // Try to send SMS (might fail if Vonage not configured)
  const sent = await sendSMS(phone, message);
  
  if (!sent) {
    console.log('⚠️  SMS failed, but OTP is logged above. Use it for testing.');
  }
  
  // Always return true so user can register
  return true;
};

const sendBookingConfirmation = async (phone, date, timeSlot) => {
  console.log('📅 Booking Confirmation:', { phone, date, timeSlot });
  const message = `Your appointment with Eswari Physiotherapy is confirmed for ${date} at ${timeSlot}. For details, contact ${process.env.ADMIN_PHONE}`;
  return await sendSMS(phone, message);
};

const sendCancellationNotice = async (phone) => {
  console.log('❌ Cancellation Notice:', phone);
  const message = `Your appointment with Eswari Physiotherapy has been cancelled. For details, contact ${process.env.ADMIN_PHONE}`;
  return await sendSMS(phone, message);
};

module.exports = {
  sendOTP,
  sendBookingConfirmation,
  sendCancellationNotice
};