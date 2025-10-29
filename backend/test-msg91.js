require('dotenv').config();
const { sendOTP, sendBookingConfirmation, sendCancellationNotice } = require('./utils/smsService');

console.log('\n📱 Testing MSG91 SMS Service\n');
console.log('═'.repeat(60));

const testPhone = '+919524350214'; // Your admin phone
const testOTP = '123456';

async function runTests() {
  console.log('1. Testing OTP SMS...');
  await sendOTP(testPhone, testOTP);
  
  console.log('\n2. Testing Booking Confirmation SMS...');
  await sendBookingConfirmation(testPhone, 'December 25, 2024', '10:00 AM - 10:50 AM');
  
  console.log('\n3. Testing Cancellation SMS...');
  await sendCancellationNotice(testPhone);
  
  console.log('\n✅ All tests completed!');
  console.log('Check your phone for SMS messages.');
  process.exit(0);
}

runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});