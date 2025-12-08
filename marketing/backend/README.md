# RageVFX Backend API

Express.js backend for handling Stripe subscriptions and user management.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env and add your Stripe keys
```

3. Run the server:
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Create Subscription
```
POST /api/create-subscription
Content-Type: application/json

{
  "email": "user@example.com",
  "paymentMethodId": "pm_...",
  "priceId": "price_..."
}
```

### Cancel Subscription
```
POST /api/cancel-subscription
Content-Type: application/json

{
  "subscriptionId": "sub_..."
}
```

### Check Subscription Status
```
GET /api/subscription-status?customerId=cus_xxx
GET /api/subscription-status?email=user@example.com
```

### Stripe Webhook
```
POST /api/stripe-webhook
(Handled automatically by Stripe)
```

### Generate Download Token
```
POST /api/generate-download-token
Content-Type: application/json

{
  "customerId": "cus_...",
  "platform": "windows|macos|linux"
}
```

## Webhook Configuration

1. In Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe-webhook`
3. Select events:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
4. Copy webhook secret to `.env`

## Production Considerations

⚠️ This is a basic implementation. For production:

1. **Add Database**: Replace in-memory storage with PostgreSQL/MongoDB
2. **Add Authentication**: Implement JWT or session-based auth
3. **Add Rate Limiting**: Prevent API abuse (use express-rate-limit)
4. **Add Logging**: Use Winston or similar
5. **Add Input Validation**: Use Joi or similar for request validation
6. **Add Error Tracking**: Use Sentry or similar
7. **Add Tests**: Unit and integration tests
8. **Secure Download URLs**: Implement proper JWT with jsonwebtoken library
   ```bash
   npm install jsonwebtoken
   ```
   Use `jwt.sign()` and `jwt.verify()` with RS256 or HS256
9. **Add Email Service**: Send transactional emails (SendGrid, Postmark)
10. **Add User Management**: Full CRUD for users
11. **Add Idempotency**: Already implemented for subscription creation
12. **Environment Secrets**: Use strong secrets for JWT_SECRET and DOWNLOAD_TOKEN_SECRET

## Deployment

### Railway
```bash
railway login
railway init
railway add
railway up
```

### Heroku
```bash
heroku create ragevfx-api
heroku config:set STRIPE_SECRET_KEY=sk_...
git push heroku main
```

### Render
1. Create new Web Service
2. Connect GitHub repo
3. Set build command: `cd marketing/backend && npm install`
4. Set start command: `node marketing/backend/server.js`
5. Add environment variables

## Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

Test the API:
```bash
# Health check
curl http://localhost:3001/api/health

# Create subscription (replace with actual values)
curl -X POST http://localhost:3001/api/create-subscription \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","paymentMethodId":"pm_test","priceId":"price_test"}'
```
