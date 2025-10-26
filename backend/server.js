const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server running - v3.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Eswari Physiotherapy API v3.0',
    health: '/api/health'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/admin', require('./routes/admin'));

// Start server on 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log('============================================================');
  console.log(`🚀 Server v3.0 running on http://0.0.0.0:${PORT}`);
  console.log(`📍 Health: /api/health`);
  console.log('============================================================');
});

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
})
.then(() => {
  console.log('✅ MongoDB Connected');
  console.log('📊 Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
  console.error('❌ MongoDB Error:', err.message);
  setTimeout(() => {
    mongoose.connect(process.env.MONGODB_URI);
  }, 5000);
});

// Simple error handling - no shutdown
process.on('unhandledRejection', (err) => {
  console.error('❌ Rejection:', err.message);
});

// Ignore signals - let Railway manage lifecycle
process.on('SIGTERM', () => console.log('⚠️ SIGTERM - ignored'));
process.on('SIGINT', () => console.log('⚠️ SIGINT - ignored'));

console.log('✅ App initialized v3.0');
