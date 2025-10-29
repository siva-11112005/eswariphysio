const axios = require('axios');
const https = require('https');

// MSG91 Configuration
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'TXTIND';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || '';

// Create axios instance with SSL bypass for MSG91
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  }),
  timeout: 15000
});

const sendSMS = async (phone, message) => {
  try {
    // Remove +91 prefix and leading zeros
    const phoneNumber = phone.replace('+91', '').replace(/^0+/, '');
    
    // Validate phone number
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      console.error('❌ Invalid phone number format:', phoneNumber);
      return false;
    }
    
    console.log('📱 MSG91 SMS Details:');
    console.log('   To:', phoneNumber);
    console.log('   Message:', message.substring(0, 60) + '...');
    console.log('   Sender ID:', MSG91_SENDER_ID);
    console.log('   Auth Key:', MSG91_AUTH_KEY ? '***' + MSG91_AUTH_KEY.slice(-4) : 'NOT SET');
    
    // Method 1: Try new MSG91 API (v2)
    try {
      const response = await axiosInstance.post('https://control.msg91.com/api/v2/sendsms', {
        sender: MSG91_SENDER_ID,
        route: '4',
        country: '91',
        sms: [
          {
            message: message,
            to: [phoneNumber]
          }
        ]
      }, {
        headers: {
          'authkey': MSG91_AUTH_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ MSG91 v2 Response:', response.data);
      
      if (response.data.type === 'success' || response.data.message === 'SMS sent successfully') {
        console.log('✅ SMS sent successfully via MSG91 v2');
        return true;
      }
    } catch (v2Error) {
      console.log('⚠️ MSG91 v2 failed, trying v1...');
    }
    
    // Method 2: Fallback to MSG91 v1 API
    const params = new URLSearchParams({
      authkey: MSG91_AUTH_KEY,
      mobiles: '91' + phoneNumber,
      message: message,
      sender: MSG91_SENDER_ID,
      route: '4',
      country: '91',
      DLT_TE_ID: MSG91_TEMPLATE_ID || ''
    });
    
    const response = await axiosInstance.post(
      'https://api.msg91.com/api/sendhttp.php',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('✅ MSG91 v1 Response:', response.data);
    
    // Check response
    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    // MSG91 returns a request ID if successful
    if (responseText && responseText.length > 20) {
      console.log('✅ SMS queued successfully (Request ID:', responseText.substring(0, 20) + '...)');
      return true;
    }
    
    console.error('❌ Unexpected MSG91 response:', responseText);
    return false;
    
  } catch (error) {
    console.error('❌ MSG91 Error:', error.message);
    
    if (error.response) {
      console.error('   Response Status:', error.response.status);
      console.error('   Response Data:', error.response.data);
      
      // Common MSG91 errors
      if (error.response.status === 401) {
        console.error('   ⚠️ Authentication failed - Check your MSG91_AUTH_KEY');
      } else if (error.response.status === 402) {
        console.error('   ⚠️ Insufficient balance in MSG91 account');
      }
    }
    
    // Log OTP for manual verification
    if (message.includes('OTP') || message.includes('otp')) {
      const otpMatch = message.match(/\d{6}/);
      if (otpMatch) {
        console.log('');
        console.log('═'.repeat(70));
        console.log('📝 FALLBACK: OTP for manual verification');
        console.log('   Phone:', phone);
        console.log('   OTP Code:', otpMatch[0]);
        console.log('   Valid for: 5 minutes');
        console.log('   Note: Share this OTP manually if SMS fails');
        console.log('═'.repeat(70));
        console.log('');
      }
    }
    
    return false;
  }
};

const sendOTP = async (phone, otp) => {
  console.log('');
  console.log('═'.repeat(70));
  console.log('📱 OTP GENERATED - MSG91');
  console.log('═'.repeat(70));
  console.log('   Phone:', phone);
  console.log('   OTP:', otp);
  console.log('   Valid for: 5 minutes');
  console.log('   Service: MSG91');
  console.log('═'.repeat(70));
  console.log('');
  
  // Try multiple message formats for better delivery
  const messages = [
    `${otp} is your OTP for Eswari Physiotherapy. Valid for 5 minutes.`,
    `Your OTP for Eswari Physiotherapy is ${otp}. Valid for 5 minutes. Do not share this code.`,
    `Eswari Physio OTP: ${otp} (Valid 5 min)`
  ];
  
  let sent = false;
  for (const message of messages) {
    sent = await sendSMS(phone, message);
    if (sent) break;
  }
  
  if (!sent) {
    console.log('');
    console.log('⚠️  SMS delivery failed. Possible reasons:');
    console.log('   1. MSG91 account has no balance (100 free SMS limit reached)');
    console.log('   2. Phone number is in DND (Do Not Disturb) list');
    console.log('   3. Network issues or MSG91 service down');
    console.log('   4. AUTH_KEY is invalid or expired');
    console.log('');
    console.log('💡 Solution: Use the OTP shown above for manual verification');
    console.log('');
  }
  
  return true; // Always return true so user can proceed with manual OTP
};

const sendBookingConfirmation = async (phone, date, timeSlot) => {
  console.log('📅 Sending Booking Confirmation via MSG91');
  console.log('   Phone:', phone);
  console.log('   Date:', date);
  console.log('   Time:', timeSlot);
  
  const message = `Your appointment at Eswari Physiotherapy on ${date} at ${timeSlot} is confirmed. Ph: ${process.env.ADMIN_PHONE}`;
  
  const sent = await sendSMS(phone, message);
  
  if (!sent) {
    console.log('⚠️ Booking SMS failed - Customer will be notified manually');
  }
  
  return sent;
};

const sendCancellationNotice = async (phone) => {
  console.log('❌ Sending Cancellation Notice via MSG91');
  console.log('   Phone:', phone);
  
  const message = `Your appointment at Eswari Physiotherapy has been cancelled. For details, contact ${process.env.ADMIN_PHONE}`;
  
  const sent = await sendSMS(phone, message);
  
  if (!sent) {
    console.log('⚠️ Cancellation SMS failed - Customer will be notified manually');
  }
  
  return sent;
};

module.exports = {
  sendOTP,
  sendBookingConfirmation,
  sendCancellationNotice
};