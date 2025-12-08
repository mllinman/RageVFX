# RageVFX Marketing Website - Deployment Guide

## Overview

This guide covers deploying the RageVFX marketing website to production with Stripe subscriptions.

## Prerequisites

- Stripe account ([stripe.com](https://stripe.com))
- Hosting for frontend (Vercel, Netlify, or GitHub Pages)
- Hosting for backend (Railway, Render, or Heroku)
- Domain name (optional but recommended)

## Step 1: Stripe Configuration

### Create Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Verify your email and complete onboarding
3. Switch to Test mode for initial setup

### Create Products
1. Go to Products → Add Product
2. Create "RageVFX Pro" product
3. Add recurring price: $9.99 USD / month
4. Note the Price ID (starts with `price_`)

### Get API Keys
1. Go to Developers → API keys
2. Copy "Publishable key" (starts with `pk_test_`)
3. Copy "Secret key" (starts with `sk_test_`)
4. **Never commit secret keys to git!**

## Step 2: Frontend Deployment

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd marketing
vercel

# Follow prompts:
# - Project name: ragevfx-marketing
# - Framework: None (static)
# - Build command: (leave empty)
# - Output directory: . (current directory)
```

**Configure Environment:**
1. Go to Vercel Dashboard → Project Settings
2. Add environment variables:
   - `STRIPE_PUBLISHABLE_KEY`: Your publishable key
3. Redeploy

### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd marketing
netlify deploy --prod

# Follow prompts:
# - Publish directory: . (current directory)
```

**Configure:**
1. Go to Site Settings → Environment Variables
2. Add `STRIPE_PUBLISHABLE_KEY`

### Option C: GitHub Pages

```bash
# In repository settings:
# 1. Go to Settings → Pages
# 2. Source: Deploy from branch
# 3. Branch: main / marketing/
```

**Note:** GitHub Pages doesn't support environment variables. You'll need to:
1. Copy `config.example.js` to `config.js`
2. Add your publishable key
3. Add `config.js` to `.gitignore` (already done)
4. Deploy config.js separately or use build script

## Step 3: Backend Deployment

### Option A: Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
cd marketing/backend
railway init

# Add environment variables
railway variables set STRIPE_SECRET_KEY=sk_test_xxx
railway variables set STRIPE_WEBHOOK_SECRET=whsec_xxx
railway variables set DOWNLOAD_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
railway variables set PORT=3001

# Deploy
railway up
```

### Option B: Render

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   - Name: ragevfx-api
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node marketing/backend/server.js`
   - Instance Type: Free or Starter
5. Add environment variables (same as Railway)

### Option C: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create ragevfx-api

# Add environment variables
heroku config:set STRIPE_SECRET_KEY=sk_test_xxx
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_xxx
heroku config:set DOWNLOAD_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Deploy
git subtree push --prefix marketing/backend heroku main
```

## Step 4: Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-api-domain.com/api/stripe-webhook`
3. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy Webhook Secret (starts with `whsec_`)
5. Add to backend environment variables

## Step 5: Update Frontend Configuration

Update `marketing/app.js` with your production API URL:

```javascript
const API_URL = 'https://your-api-domain.com/api';
```

Or use environment-based configuration:

```javascript
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api'
  : 'https://your-api-domain.com/api';
```

## Step 6: Database Setup (Recommended)

### PostgreSQL on Railway

```bash
# Add PostgreSQL
railway add postgresql

# Get connection string
railway variables
# Copy DATABASE_URL
```

### Update Backend to Use Database

Install dependencies:
```bash
npm install pg
```

Update `server.js`:
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create tables
pool.query(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(255) UNIQUE NOT NULL,
    subscription_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    tier VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
```

## Step 7: Test Production Setup

### Test Payment Flow
1. Visit your production site
2. Click "Subscribe Now" on Pro plan
3. Use test card: `4242 4242 4242 4242`
4. Any future date, any 3-digit CVC
5. Verify subscription created in Stripe Dashboard

### Test Webhooks
1. In Stripe Dashboard → Webhooks
2. Click on your webhook
3. Send test webhook
4. Check backend logs for successful handling

### Test Downloads
1. Subscribe to Pro plan
2. Click download button
3. Verify authentication works
4. Check download token generation

## Step 8: Go Live

### Switch to Production Mode
1. In Stripe Dashboard, toggle to "Production"
2. Get production API keys
3. Create production product/price
4. Update environment variables
5. Update webhook URL

### Update Keys
```bash
# Railway
railway variables set STRIPE_SECRET_KEY=sk_live_xxx

# Render
# Update in dashboard

# Heroku
heroku config:set STRIPE_SECRET_KEY=sk_live_xxx
```

### DNS Configuration
1. Add custom domain in hosting dashboard
2. Configure DNS records:
   - Frontend: CNAME to hosting provider
   - Backend: CNAME to API hosting
3. Wait for SSL certificates

## Security Checklist

- [ ] All secrets use strong random values
- [ ] No API keys in git repository
- [ ] HTTPS/SSL enabled on all domains
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled (add express-rate-limit)
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose sensitive info
- [ ] Database has proper indexes
- [ ] Webhooks use signature verification
- [ ] JWT tokens replace basic HMAC (install jsonwebtoken)

## Monitoring Setup

### Error Tracking
```bash
npm install @sentry/node
```

Add to `server.js`:
```javascript
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### Logging
```bash
npm install winston
```

### Uptime Monitoring
- Use [UptimeRobot](https://uptimerobot.com) (free)
- Monitor both frontend and backend
- Set up alerts for downtime

## Maintenance

### Updating Stripe Prices
1. Create new price in Stripe Dashboard
2. Update price ID in frontend config
3. Redeploy

### Viewing Subscriptions
1. Go to Stripe Dashboard → Customers
2. View subscription details
3. Check payment history

### Handling Cancellations
- Cancellations are handled automatically via webhook
- Access revoked at period end
- Email notifications (add email service)

## Troubleshooting

### Payment Not Working
- Check browser console for errors
- Verify Stripe publishable key is correct
- Check backend logs
- Verify webhook is receiving events

### Download Not Working
- Check subscription status in database
- Verify DOWNLOAD_TOKEN_SECRET is set
- Check token expiration
- Review backend logs

### Webhook Failures
- Verify webhook URL is accessible
- Check webhook secret is correct
- Review Stripe webhook logs
- Check backend error logs

## Support

- **Documentation**: See README.md files
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **Issues**: GitHub Issues
- **Email**: enterprise@ragevfx.com

## Next Steps

1. ✅ Deploy and test in production
2. 🎯 Add user authentication (Auth0, Firebase)
3. 📧 Setup email notifications (SendGrid, Postmark)
4. 📊 Add analytics (Google Analytics, Plausible)
5. 🔍 Setup SEO (sitemap, robots.txt)
6. 📱 Test on mobile devices
7. 🚀 Launch marketing campaign
8. 📈 Monitor metrics and optimize

Good luck with your launch! 🎉
