/**
 * Production server for RageVFX web app
 * Serves static files from dist-web directory
 * Compatible with Railway and other cloud platforms
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist-web');

// Serve static files from dist-web
app.use(express.static(DIST_DIR));

// Handle client-side routing - serve index.html for all routes
// Use a middleware approach instead of app.get('*')
app.use((req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RageVFX web server running on port ${PORT}`);
  console.log(`Serving from: ${DIST_DIR}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
