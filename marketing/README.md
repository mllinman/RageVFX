# RageVFX Marketing Website

Modern, sleek marketing website for RageVFX with Stripe subscription integration.

## Features

- ✨ Modern, responsive design matching the app's colorspace
- 🎨 Animated hero section with particle effects
- 💳 Stripe payment integration for subscriptions
- 📱 Mobile-responsive layout
- 🎯 Free tier, Standard tier ($9.95/month), and Pro tier ($29.95/month) pricing
- 📦 Download section for desktop apps (Pro users only)
- 🌐 Web app access for all users

## Setup

### 1. Stripe Integration

To enable payment functionality:

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
3. Create products and prices for Standard ($9.95/month) and Pro ($29.95/month) subscriptions
4. Update the configuration in `app.js`:

```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_ACTUAL_KEY';
const STRIPE_PRICES = {
  standard: 'price_YOUR_STANDARD_PRICE_ID',
  pro: 'price_YOUR_PRO_PRICE_ID',
};
```

### 2. Backend API (Required for Production)

You need to implement a backend API to handle:

- Creating Stripe customers
- Managing subscriptions
- Handling webhooks
- Authenticating users
- Authorizing downloads

Example backend endpoints needed:

```
POST /api/create-subscription
POST /api/cancel-subscription
GET  /api/subscription-status
POST /api/stripe-webhook
```

#### Quick Backend Setup with Node.js/Express:

```bash
# In a new directory (e.g., marketing/backend/)
npm init -y
npm install express stripe dotenv cors
```

Example `server.js`:

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.json());
app.use(cors());

app.post('/api/create-subscription', async (req, res) => {
  try {
    const { email, paymentMethodId, priceId } = req.body;
    
    // Create customer
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    
    // Create subscription with 7-day trial
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: 7,
      expand: ['latest_invoice.payment_intent'],
    });
    
    res.json({ subscription });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));
```

### 3. Local Development

Serve the marketing website:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000

# Or use Vite (recommended)
cd marketing
npx vite
```

Visit `http://localhost:8000` to view the website.

### 4. Production Deployment

#### Static Hosting (Vercel, Netlify, GitHub Pages):

1. Build is not required - these are static files
2. Set up your domain and SSL
3. Configure environment variables for Stripe keys
4. Deploy the `marketing/` directory

#### With Backend:

1. Deploy backend API (e.g., to Heroku, Railway, Render)
2. Update `app.js` to point to your API endpoint
3. Configure Stripe webhook endpoint
4. Deploy frontend to static hosting

## Color Scheme

The website matches the app's professional dark theme:

- Primary Background: `#0d0d0d`
- Secondary Background: `#1a1a1a`
- Accent Primary: `#ff6b35` (Orange)
- Accent Secondary: `#f7931e` (Gold)
- Text Primary: `#f0f0f0`
- Success: `#4caf50`

## Pricing Structure

### Free Tier
- Web app access
- Basic nodes only
- 720p export
- Community support
- 1GB cloud storage

### Standard Tier ($9.95/month)
- Everything in Free
- 176+ nodes
- 1080p export
- Basic VFX effects
- Email support
- 10GB cloud storage

### Pro Tier ($29.95/month)
- Everything in Standard
- Desktop app downloads (Windows, macOS, Linux)
- 8K+ export support
- Advanced VFX nodes
- Priority support
- Unlimited cloud storage
- Commercial license
- OpenVDB tools
- Blender integration

### Enterprise (Coming Soon)
- Custom pricing
- Team collaboration
- SSO & security
- Custom integrations

## Files Structure

```
marketing/
├── index.html          # Main landing page
├── styles.css          # Styling (matches app colorspace)
├── app.js              # Interactive features & Stripe integration
├── README.md           # This file
└── backend/            # (Optional) Backend API implementation
    └── server.js       # Express server for Stripe
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit secret keys** - Use environment variables
2. **Validate on backend** - Never trust client-side validation
3. **Use webhooks** - Handle subscription events properly
4. **Implement authentication** - Protect download endpoints
5. **Rate limiting** - Prevent abuse of API endpoints
6. **HTTPS only** - Use SSL in production

## Testing Stripe

Use Stripe test cards:

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

Any future expiration date and any 3-digit CVC.

## Support

For issues or questions:
- GitHub Issues: https://github.com/mllinman/RageVFX/issues
- Documentation: https://github.com/mllinman/RageVFX

## License

MIT License - See LICENSE file in root directory
