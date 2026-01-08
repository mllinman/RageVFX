# RageVFX Dashboard Deployment Guide

This guide covers deploying the RageVFX dashboard to various platforms.

## Environment Variables

The dashboard requires certain environment variables to function properly, especially in production.

### Required Environment Variables

#### NextAuth Configuration

**NEXTAUTH_SECRET** (Required in production)
- Purpose: Used to encrypt JWT tokens and secure session data
- Generation: Run `openssl rand -base64 32` to generate a secure random string
- Example: `NEXTAUTH_SECRET=your-generated-secret-here`
- **Important**: This MUST be set in production to avoid the `NO_SECRET` error

**NEXTAUTH_URL** (Required)
- Purpose: The canonical URL of your deployed application
- Local development: `http://localhost:3000`
- Production: `https://yourdomain.com`
- Example: `NEXTAUTH_URL=https://dashboard.ragevfx.com`

### Optional Environment Variables

**NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
- Purpose: Stripe publishable key for payment processing
- Get from: https://dashboard.stripe.com/apikeys
- Example: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` (production) or `pk_test_...` (testing)
- Note: `NEXT_PUBLIC_` prefix makes this available in the browser

**STRIPE_SECRET_KEY**
- Purpose: Stripe secret key for server-side API calls
- Get from: https://dashboard.stripe.com/apikeys
- Example: `STRIPE_SECRET_KEY=sk_live_...` (production) or `sk_test_...` (testing)
- **Important**: Never expose this in client-side code

**DATABASE_URL**
- Purpose: Connection string for PostgreSQL/Supabase database
- Example: `DATABASE_URL=postgresql://user:password@host:5432/database`

## Platform-Specific Deployment

### Vercel

1. **Connect your repository** to Vercel
2. **Set environment variables** in Project Settings → Environment Variables:
   ```
   NEXTAUTH_SECRET=your-generated-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```
3. **Deploy**: Vercel will automatically deploy on push to main branch

### Railway

1. **Create a new project** on Railway
2. **Connect your GitHub repository**
3. **Set root directory** to `dashboard` in service settings
4. **Add environment variables** in Variables tab:
   ```
   NEXTAUTH_SECRET=your-generated-secret
   NEXTAUTH_URL=https://your-app.railway.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```
5. **Configure build command**: `npm run build`
6. **Configure start command**: `npm start`

### Docker

1. **Create a `.env.production` file** (do not commit):
   ```bash
   NEXTAUTH_SECRET=your-generated-secret
   NEXTAUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

2. **Build the Docker image**:
   ```bash
   cd dashboard
   docker build -t ragevfx-dashboard .
   ```

3. **Run the container**:
   ```bash
   docker run -p 3000:3000 --env-file .env.production ragevfx-dashboard
   ```

### Other Platforms (Netlify, AWS, etc.)

Most platforms provide a way to set environment variables through their dashboard or CLI:

1. **Set the required environment variables** as described above
2. **Configure build settings**:
   - Build command: `npm run build`
   - Output directory: `.next`
   - Install command: `npm install`
3. **Deploy**

## Security Best Practices

### 1. Never Commit Secrets
- Add `.env`, `.env.local`, `.env.production` to `.gitignore`
- Use `.env.example` as a template (without real values)

### 2. Rotate Secrets Regularly
- Regenerate `NEXTAUTH_SECRET` periodically
- Rotate API keys according to your security policy

### 3. Use Different Keys for Different Environments
- Use `pk_test_...` and `sk_test_...` for development/staging
- Use `pk_live_...` and `sk_live_...` only in production

### 4. Principle of Least Privilege
- Only expose necessary environment variables to the client (using `NEXT_PUBLIC_` prefix)
- Keep secret keys server-side only

## Troubleshooting

### Error: [next-auth][error][NO_SECRET]

**Problem**: NextAuth requires a secret in production but `NEXTAUTH_SECRET` is not set.

**Solution**: 
1. Generate a secret: `openssl rand -base64 32`
2. Add it to your environment variables as `NEXTAUTH_SECRET=your-generated-secret`
3. Redeploy your application

### Warning: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing

**Problem**: Next.js detected a missing environment variable in `next.config.ts`.

**Solution**: 
- If using Stripe: Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to your environment variables
- If not using Stripe: The warning is harmless - the variable defaults to an empty string

### Environment Variables Not Updating

**Problem**: Changed environment variables but the app still uses old values.

**Solution**:
1. Rebuild the application (environment variables are embedded at build time)
2. For server-side variables, restarting the server may be sufficient
3. Clear build cache if using Vercel or similar platforms

## Local Development

For local development:

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Update values in `.env.local` with your development credentials

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The app will be available at http://localhost:3000

## Production Checklist

Before deploying to production:

- [ ] Generate a strong `NEXTAUTH_SECRET` (use `openssl rand -base64 32`)
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Use production Stripe keys (`pk_live_...` and `sk_live_...`)
- [ ] Configure database connection if using a database
- [ ] Verify `.env` files are not committed to version control
- [ ] Test authentication flows
- [ ] Test payment flows (if using Stripe)
- [ ] Set up monitoring and error tracking
- [ ] Configure proper CORS and security headers

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Stripe Documentation](https://stripe.com/docs)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)
- [Railway Documentation](https://docs.railway.app/)
