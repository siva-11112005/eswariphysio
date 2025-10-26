const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// CORS Configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint - MUST respond quickly
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Eswari Physiotherapy API',
    health: '/api/health',
    version: '1.0.0'
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected Successfully');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// CRITICAL: Bind to 0.0.0.0 for Railway
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📍 Health: http://${HOST}:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 OTP will be logged here in production`);
  console.log('='.repeat(60));
});

// Keep server alive
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Error handlers
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});