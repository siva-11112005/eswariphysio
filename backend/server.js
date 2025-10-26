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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server v3.1 STABLE',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Eswari Physiotherapy API v3.1',
    health: '/api/health'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/admin', require('./routes/admin'));

// Start server - MUST bind to 0.0.0.0 for Railway
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('============================================================');
  console.log(`🚀 Server v3.1 STABLE on http://0.0.0.0:${PORT}`);
  console.log(`📍 Health: /api/health`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('============================================================');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
})
.then(() => {
  console.log('✅ MongoDB Connected');
  console.log('📊 Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  setTimeout(() => {
    mongoose.connect(process.env.MONGODB_URI).catch(console.error);
  }, 5000);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('⚠️ Shutdown signal received, closing gracefully...');
  
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  try {
    await mongoose.connection.close(false);
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});

process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT received');
  gracefulShutdown();
});

console.log('✅ Eswari Physiotherapy API v3.1 initialized');