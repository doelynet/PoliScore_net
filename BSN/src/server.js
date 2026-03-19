const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Sequelize } = require('sequelize');
const { syncDatabase } = require('./models');

// Security middleware (require if available, fall back gracefully)
let helmet;
let hpp;
let xssClean;
let rateLimitLib;
try { helmet = require('helmet'); } catch (e) { console.warn('Optional dependency "helmet" not installed'); }
try { hpp = require('hpp'); } catch (e) { console.warn('Optional dependency "hpp" not installed'); }
try { xssClean = require('xss-clean'); } catch (e) { console.warn('Optional dependency "xss-clean" not installed'); }
try { rateLimitLib = require('rate-limit'); } catch (e) { try { rateLimitLib = require('express-rate-limit'); } catch (e2) { rateLimitLib = null; console.warn('Optional rate limiter not installed'); } }

// Socket.IO initializer
const { initSocket } = require('./config/socket');

// Redis client helpers
const { redis, connectRedis } = require('./config/redis');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);

// Test DB connection before starting server
const { testConnection } = require('./config/database');

// Models (for syncing and associations)
require('./models');

// Middleware
// Basic security hardening
app.set('trust proxy', 1);
if (helmet) app.use(helmet());
if (hpp) app.use(hpp());
if (xssClean) {
  // Skipping `xss-clean` because it attempts to assign to read-only
  // request properties in this environment (causes crashes).
  console.warn('Optional dependency "xss-clean" detected but disabled due to compatibility issues');
}

// Rate limiter: use Redis when available, otherwise fallback to express-rate-limit or in-memory
const WINDOW_SECONDS = 15 * 60; // 15 minutes
const MAX_HITS = 100;
if (rateLimitLib) {
  try {
    const limiter = rateLimitLib({ windowMs: WINDOW_SECONDS * 1000, max: MAX_HITS });
    app.use(limiter);
  } catch (e) {
    console.warn('Configured rateLimit library failed to initialize, falling back to Redis/in-memory limiter');
  }
}

// Redis-backed limiter middleware (fast path)
const ipHits = new Map(); // fallback storage if redis not ready
app.use(async (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  try {
    if (redis && redis.status === 'ready') {
      const key = `rate:${ip}`;
      const curr = await redis.incr(key);
      if (curr === 1) await redis.expire(key, WINDOW_SECONDS);
      if (curr > MAX_HITS) return res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
      return next();
    }
  } catch (err) {
    console.warn('Redis rate limiter error, falling back to in-memory:', err && err.message);
  }

  // In-memory fallback (per-process)
  const now = Date.now();
  const entry = ipHits.get(ip) || { count: 0, start: now };
  if (now - entry.start > WINDOW_SECONDS * 1000) {
    entry.count = 1;
    entry.start = now;
  } else {
    entry.count += 1;
  }
  ipHits.set(ip, entry);
  if (entry.count > MAX_HITS) return res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
  return next();
});

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { sequelize } = require('./models');
    await sequelize.authenticate();
    
    res.status(200).json({ 
      success: true,
      message: 'Bizi SN API is running',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        socket: 'ready'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ── Routes ──
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const likeRoutes = require('./routes/likeRoutes');
const followRoutes = require('./routes/followRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const billRoutes = require('./routes/billRoutes');
const billVoteRoutes = require('./routes/billVoteRoutes');
const pollRoutes = require('./routes/pollRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const conferenceRoutes = require('./routes/conferenceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
// Dev routes (only register when not in production)
let devRoutes;
try {
  devRoutes = require('./routes/devRoutes');
} catch (e) {
  devRoutes = null;
}

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes);       // /api/posts/:postId/comments & /api/comments/:id
app.use('/api', likeRoutes);           // /api/posts/:postId/like(s)
app.use('/api/users', followRoutes);   // /api/users/:userId/follow(ers|ing)
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);     // /api/users/search, /api/users/:username, /api/users/profile
app.use('/api/bills', billRoutes);
app.use('/api/bills', billVoteRoutes);
app.use('/api/posts', pollRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conferences', conferenceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

if (process.env.NODE_ENV !== 'production' && devRoutes) {
  app.use('/api/dev', devRoutes);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`
  });
});

// ── Global error handler ──
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Start server (attach Socket.IO to the HTTP server)
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    // Connect to Redis if possible (no-op if environment not configured)
    try {
      await connectRedis();
      console.log('Redis connected');
    } catch (e) {
      console.warn('Redis not available at startup:', e && e.message);
    }

    await syncDatabase();

    const httpServer = http.createServer(app);

    // Initialize Socket.IO (returns io instance). It will handle auth via JWT.
    try {
      initSocket(httpServer);
      console.log('Socket.IO initialized');
    } catch (e) {
      console.warn('Failed to initialize Socket.IO:', e.message || e);
    }

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();