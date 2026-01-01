const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const categoryRoutes = require('./routes/categories');
const brandRoutes = require('./routes/brands');
const adminRoutes = require('./routes/admin');
const confirmatriceRoutes = require('./routes/confirmatrice');
const agentLivraisonRoutes = require('./routes/agent-livraison');
const uploadRoutes = require('./routes/upload');
const shippingRoutes = require('./routes/shipping');
const sseRoutes = require('./routes/sse');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Heroku
app.set('trust proxy', 1);

// Static files with CORS headers (before other middleware)
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  next();
}, express.static('uploads', {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// Security middleware (with exceptions for uploads)
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting (temporarily increased for development)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // increased to 1000 for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration for production and development
const allowedOrigins = [
  process.env.FRONTEND_URL, // Production Vercel URL
  'https://loudbrandss.com', // Production domain
  'https://www.loudbrandss.com', // Production domain with www
  'http://localhost:3000', // Development
  'http://127.0.0.1:3000' // Development
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Check if origin matches allowed domains or includes trusted substrings
    const isAllowed = allowedOrigins.includes(origin) ||
      origin.includes('loudbrandss.com') ||
      origin.includes('loudbrands-backend') ||
      origin.includes('vercel.app') ||
      origin.includes('localhost');

    if (!isAllowed) {
      console.log('CORS blocked origin:', origin);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle preflight requests
app.options('*', cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Debug endpoint for CORS testing
app.get('/api/debug', (req, res) => {
  res.status(200).json({
    message: 'API is working',
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'LoudBrands API',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      categories: '/api/categories',
      brands: '/api/brands',
      admin: '/api/admin',
      confirmatrice: '/api/confirmatrice',
      'agent-livraison': '/api/agent-livraison',
      upload: '/api/upload',
      shipping: '/api/shipping'
    },
    health: '/health',
    debug: '/api/debug'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/confirmatrice', confirmatriceRoutes);
app.use('/api/agent-livraison', agentLivraisonRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/sse', sseRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;