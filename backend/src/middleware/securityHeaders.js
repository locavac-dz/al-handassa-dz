// Security Headers Middleware - Production Ready

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');

// Rate limiting for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limit for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.'
});

// Register payment limiter
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 payment attempts per hour
  message: 'Payment rate limit exceeded.'
});

module.exports = {
  /**
   * Apply all security middleware
   */
  applySecurityMiddleware: (app) => {
    // Helmet for HTTP headers
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permissionsPolicy: {
        geolocation: [],
        microphone: [],
        camera: []
      }
    }));

    // CORS
    app.use((req, res, next) => {
      const allowedOrigins = [
        'https://alhandassa.dz',
        'https://www.alhandassa.dz',
        'http://localhost:3000',
        'http://localhost:5000'
      ];

      if (allowedOrigins.includes(req.headers.origin)) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
      }

      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // Input sanitization
    app.use(mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        console.warn(`Sanitized input on key: ${key}`);
      }
    }));

    // Rate limiting
    app.use('/api/', apiLimiter);
    app.use('/api/auth/login', loginLimiter);
    app.use('/api/payments', paymentLimiter);

    console.log('✅ Security headers applied');
  },

  apiLimiter,
  loginLimiter,
  paymentLimiter,

  /**
   * Validate API key
   */
  validateApiKey: (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    next();
  },

  /**
   * Log security events
   */
  logSecurityEvent: (event, data) => {
    const timestamp = new Date().toISOString();
    console.log(`[SECURITY] ${timestamp} - ${event}:`, data);
    // TODO: Send to security monitoring service
  }
};
