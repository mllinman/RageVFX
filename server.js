/**
 * Production server for RageVFX web app
 * Serves static files from dist-web directory
 * Compatible with Railway and other cloud platforms
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist-web');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');

// Load package.json once at startup
const packageJson = require('./package.json');

// Check if build directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error(`Error: Build directory not found at ${DIST_DIR}`);
  console.error('Please run "npm run build:web" first to generate the web app.');
  console.error('Current directory:', __dirname);
  console.error('Directory contents:', fs.readdirSync(__dirname));
  process.exit(1);
}

// Check if index.html exists
if (!fs.existsSync(INDEX_PATH)) {
  console.error(`Error: index.html not found at ${INDEX_PATH}`);
  console.error('Please run "npm run build:web" to generate the web app.');
  console.error('dist-web contents:', fs.readdirSync(DIST_DIR));
  process.exit(1);
}

// Log build directory contents for debugging
console.log('Build directory exists:', DIST_DIR);
console.log('Files in dist-web:', fs.readdirSync(DIST_DIR));
const assetsDir = path.join(DIST_DIR, 'assets');
if (fs.existsSync(assetsDir)) {
  console.log('Assets found:', fs.readdirSync(assetsDir).length, 'files');
}

// Rate limiting middleware - prevents abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiting to all requests
app.use(limiter);

// Health check endpoint (before logging middleware)
app.get('/health', (req, res) => {
  const assetsDir = path.join(DIST_DIR, 'assets');
  const assetsExist = fs.existsSync(assetsDir);
  
  res.json({
    status: 'ok',
    version: packageJson.version,
    distDir: DIST_DIR,
    indexExists: fs.existsSync(INDEX_PATH),
    assetsExists: assetsExist,
    assetCount: assetsExist ? fs.readdirSync(assetsDir).length : 0,
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Logging middleware for debugging (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// Serve static files from dist-web with proper headers
app.use(express.static(DIST_DIR, {
  setHeaders: (res, filepath) => {
    // Set proper MIME types
    if (filepath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
    // Enable caching for assets
    if (filepath.includes('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Handle client-side routing - serve index.html for all other routes
// This middleware runs only when no static file matches
app.use((req, res, next) => {
  // Only serve index.html if response hasn't been sent (i.e., no static file matched)
  if (!res.headersSent) {
    res.sendFile(INDEX_PATH, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        if (!res.headersSent) {
          res.status(500).send('Internal Server Error');
        }
      }
    });
  } else {
    // Response already sent by static middleware
    next();
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RageVFX web server running on port ${PORT}`);
  console.log(`Serving from: ${DIST_DIR}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
