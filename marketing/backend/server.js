// RageVFX Backend API for Stripe Subscription Management
// This is a basic implementation scaffold - expand for production use

require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with database in production)
const subscriptions = new Map();

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Create a new subscription
 * POST /api/create-subscription
 * Body: { email, paymentMethodId, priceId }
 */
app.post('/api/create-subscription', async (req, res) => {
  try {
    const { email, paymentMethodId, priceId } = req.body;
    
    if (!email || !paymentMethodId || !priceId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Use idempotency key to prevent duplicate requests
    const idempotencyKey = `${email}-${Date.now()}`;
    
    // Create or retrieve customer
    let customer;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      
      // Attach payment method to customer (with error handling for already attached)
      try {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        });
      } catch (error) {
        // Payment method might already be attached, continue
        if (error.code !== 'resource_already_attached') {
          throw error;
        }
      }
      
      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } else {
      // Create new customer with idempotency key
      customer = await stripe.customers.create({
        email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
        metadata: {
          source: 'ragevfx_marketing',
        },
      }, {
        idempotencyKey: `create-customer-${idempotencyKey}`,
      });
    }
    
    // Create subscription with 7-day trial
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: 7,
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tier: 'pro',
        platform: 'ragevfx',
      },
    });
    
    // Store subscription info (use database in production)
    subscriptions.set(customer.id, {
      subscriptionId: subscription.id,
      customerId: customer.id,
      email,
      status: subscription.status,
      tier: 'pro',
      createdAt: new Date().toISOString(),
    });
    
    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trial_end: subscription.trial_end,
        current_period_end: subscription.current_period_end,
      },
      customer: {
        id: customer.id,
        email: customer.email,
      },
    });
    
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(400).json({ 
      error: error.message,
      type: error.type,
    });
  }
});

/**
 * Cancel a subscription
 * POST /api/cancel-subscription
 * Body: { subscriptionId }
 */
app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Missing subscription ID' });
    }
    
    // Cancel at period end (allows user to keep access until paid period ends)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    
    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end,
      },
    });
    
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(400).json({ 
      error: error.message,
      type: error.type,
    });
  }
});

/**
 * Get subscription status
 * GET /api/subscription-status?customerId=cus_xxx
 */
app.get('/api/subscription-status', async (req, res) => {
  try {
    const { customerId, email } = req.query;
    
    if (!customerId && !email) {
      return res.status(400).json({ error: 'Missing customer ID or email' });
    }
    
    let customer;
    if (customerId) {
      customer = await stripe.customers.retrieve(customerId);
    } else {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length === 0) {
        return res.json({ hasSubscription: false });
      }
      customer = customers.data[0];
    }
    
    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10,
    });
    
    if (subscriptions.data.length === 0) {
      return res.json({ hasSubscription: false });
    }
    
    const subscription = subscriptions.data[0];
    
    res.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        tier: subscription.metadata.tier || 'pro',
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      customer: {
        id: customer.id,
        email: customer.email,
      },
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(400).json({ 
      error: error.message,
      type: error.type,
    });
  }
});

/**
 * Stripe webhook handler
 * POST /api/stripe-webhook
 */
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('Webhook secret not configured');
    return res.sendStatus(400);
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.sendStatus(400);
  }
  
  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        console.log('Subscription created:', event.data.object.id);
        // TODO: Send welcome email, grant access
        break;
        
      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.data.object.id);
        // TODO: Update user access level
        break;
        
      case 'customer.subscription.deleted':
        console.log('Subscription cancelled:', event.data.object.id);
        // TODO: Revoke access, send cancellation email
        break;
        
      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        // TODO: Send receipt, extend subscription
        break;
        
      case 'invoice.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        // TODO: Send payment failure notification
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * Generate download token (for authenticated downloads)
 * POST /api/generate-download-token
 * Body: { customerId, platform }
 * 
 * SECURITY NOTE: This is a basic implementation for demonstration.
 * For production, implement proper JWT with cryptographic signing:
 * 
 * const jwt = require('jsonwebtoken');
 * const token = jwt.sign(
 *   { customerId, platform, expires: Date.now() + 3600000 },
 *   process.env.JWT_SECRET,
 *   { expiresIn: '1h' }
 * );
 */
app.post('/api/generate-download-token', async (req, res) => {
  try {
    const { customerId, platform } = req.body;
    
    if (!customerId || !platform) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Verify subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });
    
    if (subscriptions.data.length === 0) {
      return res.status(403).json({ error: 'No active subscription' });
    }
    
    // WARNING: This is NOT cryptographically secure!
    // Base64 is encoding, not encryption. Anyone can decode and modify this.
    // For production: Use jsonwebtoken (JWT) with HMAC-SHA256 or RS256
    const crypto = require('crypto');
    const payload = JSON.stringify({
      customerId,
      platform,
      expires: Date.now() + 3600000, // 1 hour
    });
    
    // Create a basic HMAC signature (still requires JWT library in production)
    const secret = process.env.DOWNLOAD_TOKEN_SECRET || 'CHANGE_THIS_SECRET';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const token = Buffer.from(JSON.stringify({
      payload,
      signature,
    })).toString('base64');
    
    res.json({
      success: true,
      token,
      downloadUrl: `/downloads/${platform}/RageVFX-latest?token=${token}`,
      note: 'For production, implement proper JWT with jsonwebtoken library',
    });
    
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(400).json({ 
      error: error.message,
    });
  }
});

// ============================================================================
// Server Startup
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  RageVFX Subscription API Server                           ║
║  Running on http://localhost:${PORT}                         ║
╚════════════════════════════════════════════════════════════╝

Environment Configuration:
- Stripe Secret Key: ${process.env.STRIPE_SECRET_KEY ? '✓ Configured' : '✗ Missing'}
- Webhook Secret: ${process.env.STRIPE_WEBHOOK_SECRET ? '✓ Configured' : '✗ Missing (optional)'}

Available Endpoints:
- GET  /api/health
- POST /api/create-subscription
- POST /api/cancel-subscription
- GET  /api/subscription-status
- POST /api/stripe-webhook
- POST /api/generate-download-token

To configure:
1. Copy .env.example to .env
2. Add your Stripe secret key
3. (Optional) Add webhook secret for production
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
  });
});
