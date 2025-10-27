require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const testPhone = '+917418042205'; // Your verified number

console.log('🧪 Testing Twilio Configuration...\n');
console.log('Account SID:', accountSid);
console.log('Auth Token:', authToken ? '***' + authToken.slice(-4) : 'NOT SET');
console.log('Twilio Phone:', twilioPhone);
console.log('Test Phone:', testPhone);
console.log('');

if (!accountSid || !authToken || !twilioPhone) {
  console.error('❌ Missing Twilio credentials in .env file');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

console.log('📱 Sending test SMS...\n');

client.messages
  .create({
    body: 'Test message from Eswari Physiotherapy! 🎉 Twilio integration is working!',
    from: twilioPhone,
    to: testPhone
  })
  .then(message => {
    console.log('✅ SUCCESS! SMS Sent!');
    console.log('');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('To:', message.to);
    console.log('From:', message.from);
    console.log('');
    console.log('📱 Check your phone for the SMS!');
    console.log('');
  })
  .catch(error => {
    console.error('❌ ERROR sending SMS:');
    console.error('');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('');
    
    if (error.code === 21608) {
      console.log('⚠️  SOLUTION: The phone number is not verified.');
      console.log('');
      console.log('Steps to fix:');
      console.log('1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      console.log('2. Click "+ Add a new Caller ID"');
      console.log('3. Enter: +917418042205');
      console.log('4. Verify with code sent to your phone');
      console.log('5. Run this test again');
    } else if (error.code === 21211) {
      console.log('⚠️  SOLUTION: Invalid phone number format');
      console.log('Make sure number includes country code: +917418042205');
    } else if (error.code === 20003) {
      console.log('⚠️  SOLUTION: Authentication failed');
      console.log('Check your Account SID and Auth Token in .env');
    }
    console.log('');
  });