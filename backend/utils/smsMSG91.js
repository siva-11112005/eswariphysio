const axios = require('axios');
const https = require('https');

// MSG91 Configuration
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'TXTIND';

// Create axios instance with SSL bypass for MSG91
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false // Bypass SSL certificate validation
  }),
  timeout: 15000
});

const sendSMS = async (phone, message) => {
  try {
    // Remove +91 prefix and leading zeros
    const phoneNumber = phone.replace('+91', '').replace(/^0+/, '');
    
    // Validate phone number
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      console.error('‚ùå Invalid phone number format:', phoneNumber);
      return false;
    }
    
    console.log('Ì≥± MSG91 SMS Details:');
    console.log('   To:', phoneNumber);
    console.log('   Message:', message.substring(0, 60) + '...');
    console.log('   Sender ID:', MSG91_SENDER_ID);
    
    // MSG91 API call with SSL bypass
    const response = await axiosInstance.get('https://api.msg91.com/api/sendhttp.php', {
      params: {
        authkey: MSG91_AUTH_KEY,
        mobiles: phoneNumber,
        message: message,
        sender: MSG91_SENDER_ID,
        route: '4',
        country: '91'
      }
    });
    
    console.log('‚úÖ MSG91 Response:', response.data);
    
    // Check response
    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    if (responseText.includes('success') || responseText.includes('Success') || responseText.includes('SMS sent')) {
      console.log('‚úÖ SMS sent successfully via MSG91');
      return true;
    } else if (responseText.includes('error') || responseText.includes('Error')) {
      console.error('‚ùå MSG91 Error in response:', responseText);
      return false;
    } else {
      console.log('‚úÖ SMS sent (MSG91 response processed)');
      return true;
    }
    
  } catch (error) {
    console.error('‚ùå MSG91 Error:', error.message);
    
    if (error.response) {
      console.error('   Response:', error.response.data);
      console.error('   Status:', error.response.status);
    }
    
    // Log OTP for debugging
    if (message.includes('OTP') || message.includes('otp')) {
      const otpMatch = message.match(/\d{6}/);
      if (otpMatch) {
        console.log('Ì¥ê OTP (for admin reference):', otpMatch[0]);
      }
    }
    
    return false;
  }
};

const sendOTP = async (phone, otp) => {
  console.log('');
  console.log('‚ïê'.repeat(70));
  console.log('Ì¥ê OTP GENERATED - MSG91');
  console.log('‚ïê'.repeat(70));
  console.log('   Phone:', phone);
  console.log('   OTP:', otp);
  console.log('   Valid for: 5 minutes');
  console.log('   Service: MSG91 (100 FREE SMS)');
  console.log('‚ïê'.repeat(70));
  console.log('');
  
  const message = `Your OTP for Eswari Physiotherapy is ${otp}. Valid for 5 minutes. Do not share this code.`;
  
  const sent = await sendSMS(phone, message);
  
  if (!sent) {
    console.log('‚ö†Ô∏è  SMS failed - Check error above. OTP logged for manual sharing.');
  }
  
  return true;
};

const sendBookingConfirmation = async (phone, date, timeSlot) => {
  console.log('Ì≥Ö Sending Booking Confirmation via MSG91');
  console.log('   Phone:', phone);
  console.log('   Date:', date);
  console.log('   Time:', timeSlot);
  
  const message = `Your appointment with Eswari Physiotherapy is confirmed for ${date} at ${timeSlot}. Contact: ${process.env.ADMIN_PHONE}`;
  
  return await sendSMS(phone, message);
};

const sendCancellationNotice = async (phone) => {
  console.log('‚ùå Sending Cancellation Notice via MSG91');
  console.log('   Phone:', phone);
  
  const message = `Your appointment with Eswari Physiotherapy has been cancelled. For details, contact ${process.env.ADMIN_PHONE}`;
  
  return await sendSMS(phone, message);
};

module.exports = {
  sendOTP,
  sendBookingConfirmation,
  sendCancellationNotice
};
