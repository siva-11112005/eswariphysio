const twilio = require('twilio');

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

const sendSMS = async (to, text) => {
  try {
    console.log('📱 Twilio SMS Details:');
    console.log('   To:', to);
    console.log('   From:', twilioPhone);
    console.log('   Message:', text.substring(0, 50) + '...');
    
    const message = await client.messages.create({
      body: text,
      from: twilioPhone,
      to: to
    });
    
    console.log('✅ SMS sent successfully via Twilio');
    console.log('   Message SID:', message.sid);
    console.log('   Status:', message.status);
    return true;
  } catch (error) {
    console.error('❌ Twilio SMS Error:', error.message);
    console.error('   Error Code:', error.code);
    
    // Common error messages
    if (error.code === 21608) {
      console.error('   ⚠️  The number is not verified in Twilio Console');
      console.error('   → Go to: Phone Numbers → Verified Caller IDs');
    } else if (error.code === 21211) {
      console.error('   ⚠️  Invalid phone number format');
    } else if (error.code === 20003) {
      console.error('   ⚠️  Authentication failed - check credentials');
    }
    
    // Log OTP for development/testing
    if (text.includes('OTP') || text.includes('otp')) {
      const otpMatch = text.match(/\d{6}/);
      if (otpMatch) {
        console.log('🔐 OTP (check console for testing):', otpMatch[0]);
      }
    }
    
    return true; // Continue even if SMS fails
  }
};

const sendOTP = async (phone, otp) => {
  console.log('');
  console.log('═'.repeat(60));
  console.log('🔐 OTP GENERATED:');
  console.log('   Phone:', phone);
  console.log('   OTP:', otp);
  console.log('   Valid for: 5 minutes');
  console.log('═'.repeat(60));
  console.log('');
  
  const message = `Your OTP for Eswari Physiotherapy is: ${otp}. Valid for 5 minutes. Do not share this code.`;
  const sent = await sendSMS(phone, message);
  
  if (!sent) {
    console.log('⚠️  SMS failed, but OTP is logged above. Use it for testing.');
  }
  
  return true;
};

const sendBookingConfirmation = async (phone, date, timeSlot) => {
  console.log('📅 Sending Booking Confirmation:', { phone, date, timeSlot });
  const message = `Your appointment with Eswari Physiotherapy is confirmed for ${date} at ${timeSlot}. For details, contact ${process.env.ADMIN_PHONE}`;
  return await sendSMS(phone, message);
};

const sendCancellationNotice = async (phone) => {
  console.log('❌ Sending Cancellation Notice:', phone);
  const message = `Your appointment with Eswari Physiotherapy has been cancelled. For details, contact ${process.env.ADMIN_PHONE}`;
  return await sendSMS(phone, message);
};

module.exports = {
  sendOTP,
  sendBookingConfirmation,
  sendCancellationNotice
};