// RageVFX Marketing Website Configuration
// Copy this file to config.js and update with your actual Stripe keys

// Get these from: https://dashboard.stripe.com/test/apikeys
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';

// Get price IDs from: https://dashboard.stripe.com/test/products
export const STRIPE_PRICES = {
  pro: 'price_YOUR_PRO_PRICE_ID_HERE',
};

// Backend API URL
export const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api'
  : '/api';

// Feature flags
export const FEATURES = {
  enablePayments: true,
  enableDownloads: true,
  enableWebApp: true,
};
