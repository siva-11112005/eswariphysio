require('dotenv').config();

console.log('Environment Check:');
console.log('MSG91_AUTH_KEY:', process.env.MSG91_AUTH_KEY);
console.log('MSG91_SENDER_ID:', process.env.MSG91_SENDER_ID);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');

if (process.env.MSG91_AUTH_KEY) {
  console.log('\n✅ MSG91_AUTH_KEY is loaded!');
} else {
  console.log('\n❌ MSG91_AUTH_KEY is NOT loaded!');
  console.log('\nPossible issues:');
  console.log('1. .env file does not exist in this folder');
  console.log('2. .env file has wrong format');
  console.log('3. dotenv is not installed');
}
