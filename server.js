/**
 * Production server for RageVFX web app
 * Serves static files from dist-web directory
 * Compatible with Railway and other cloud platforms
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist-web');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');

// Check if build directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error(`Error: Build directory not found at ${DIST_DIR}`);
  console.error('Please run "npm run build:web" first to generate the web app.');
  process.exit(1);
}

// Check if index.html exists
if (!fs.existsSync(INDEX_PATH)) {
  console.error(`Error: index.html not found at ${INDEX_PATH}`);
  console.error('Please run "npm run build:web" to generate the web app.');
  process.exit(1);
}

// Serve static files from dist-web
app.use(express.static(DIST_DIR));

// Handle client-side routing - serve index.html for all other routes
// This middleware runs only when no static file matches
app.use((req, res, next) => {
  // Only serve index.html if response hasn't been sent (i.e., no static file matched)
  if (!res.headersSent) {
    res.sendFile(INDEX_PATH, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Internal Server Error');
      }
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RageVFX web server running on port ${PORT}`);
  console.log(`Serving from: ${DIST_DIR}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
