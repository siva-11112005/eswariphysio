const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); // ADD THIS LINE

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({ 
  origin: '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware (optional but helpful)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint - Primary
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    service: 'Eswari Physiotherapy API',
    version: '3.2',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    port: PORT
  };
  
  // Return 503 if MongoDB is not connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ ...healthCheck, status: 'unhealthy' });
  }
  
  res.status(200).json(healthCheck);
});

// Alternative health check at root (some services check this)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/admin', require('./routes/admin'));

// ============================================
// SERVE REACT BUILD IN PRODUCTION - ADD THIS SECTION
// ============================================
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // API 404 handler - for undefined API routes
  app.get('/api/*', (req, res) => {
    res.status(404).json({ 
      message: 'API route not found',
      path: req.path,
      method: req.method
    });
  });
  
  // Handle React routing - this should be LAST
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
} else {
  // Development mode - show API info
  app.get('/', (req, res) => {
    res.status(200).json({ 
      message: 'Eswari Physiotherapy API v3.2',
      status: 'running',
      mode: 'development',
      health: '/api/health',
      endpoints: {
        auth: '/api/auth',
        appointments: '/api/appointments',
        admin: '/api/admin'
      },
      documentation: 'https://github.com/your-repo/eswari-physio'
    });
  });
  
  // 404 handler for undefined routes in development
  app.use((req, res) => {
    res.status(404).json({ 
      message: 'Route not found',
      path: req.path,
      method: req.method
    });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start HTTP server - MUST bind to 0.0.0.0 for deployment
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('============================================================');
  console.log(`🚀 Server v3.2 on http://0.0.0.0:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Platform: ${process.env.CYCLIC_APP_ID ? 'Cyclic' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Local'}`);
  console.log(`📍 Health: /api/health`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('============================================================');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Serving React build from:', path.join(__dirname, '../frontend/build'));
  } else {
    console.log('⚠️  Development mode - React should run separately on port 3000');
  }
  
  console.log('✅ HTTP Server listening and ready to accept connections');
});

// Connect to MongoDB with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Connected');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🔗 Host:', mongoose.connection.host);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('🔄 Retrying MongoDB connection in 5 seconds...');
    
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Initial MongoDB connection
connectDB();

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected - attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️ ${signal} received - shutting down gracefully...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed - no longer accepting connections');
  });
  
  // Close MongoDB connection
  try {
    await mongoose.connection.close(false);
    console.log('✅ MongoDB connection closed');
    console.log('👋 Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err.message);
    process.exit(1);
  }
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after 30s timeout');
    process.exit(1);
  }, 30000);
};

// Process error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('❌ Reason:', reason);
  // Don't exit process in production - log and continue
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error('❌ Stack:', err.stack);
  // In production, restart via process manager
  // For now, we'll continue running
});

// Graceful shutdown signals
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM signal received');
  gracefulShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT signal received (Ctrl+C)');
  gracefulShutdown('SIGINT');
});

// Handle SIGUSR2 for nodemon restarts
process.once('SIGUSR2', () => {
  console.log('⚠️ SIGUSR2 signal received (nodemon restart)');
  gracefulShutdown('SIGUSR2').then(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

// Log successful initialization
console.log('✅ Eswari Physiotherapy API v3.2 initialized');
console.log('⚠️ Signal handlers: GRACEFUL SHUTDOWN mode enabled');

// Keep process alive - Important for deployment platforms
if (process.env.CYCLIC_APP_ID || process.env.RAILWAY_ENVIRONMENT) {
  console.log('🚂 Cloud deployment environment detected - staying alive');
  
  // Optional: Heartbeat log every 5 minutes to show the service is alive
  setInterval(() => {
    console.log(`💓 Service alive - uptime: ${Math.floor(process.uptime())}s`);
  }, 300000); // 5 minutes
}

// DO NOT ADD module.exports - This is the main entry point file!