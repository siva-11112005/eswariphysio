const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running - v2.1',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Eswari Physiotherapy API v2.1',
    health: '/api/health'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/admin', require('./routes/admin'));

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log('============================================================');
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📍 Health: /api/health`);
  console.log(`✅ Server v2.1 started - FIXED`);
  console.log('============================================================');
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// FIXED: No callbacks - use promises
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received - shutting down');
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Use promise instead of callback
    mongoose.connection.close()
      .then(() => {
        console.log('✅ MongoDB closed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('❌ Error:', err.message);
        process.exit(1);
      });
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received');
  server.close(() => {
    mongoose.connection.close()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
});

// Error handlers
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
});

console.log('✅ Application initialized v2.1');
