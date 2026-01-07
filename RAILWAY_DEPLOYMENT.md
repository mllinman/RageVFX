# Deploying RageVFX to Railway

This guide covers how to deploy the RageVFX web application to Railway.

## Overview

RageVFX includes both a desktop Electron application and a web version. This guide focuses on deploying the web version to Railway.

## Prerequisites

1. A [Railway](https://railway.app/) account
2. Railway CLI installed (optional, but recommended for local testing)
3. Git repository connected to Railway

## Deployment Options

### Option 1: Deploy via Railway Dashboard (Recommended for beginners)

1. **Connect Your Repository**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub account
   - Select the `mllinman/RageVFX` repository

2. **Configure the Service**
   Railway will automatically detect the project configuration from `railway.json` and `nixpacks.toml`.
   
   The deployment will:
   - Install dependencies with `npm ci`
   - Build the web app with `npm run build:web`
   - Start the server with `node server.js`

3. **Environment Variables** (Optional)
   - `PORT` - Automatically set by Railway
   - No additional environment variables are required

4. **Deploy**
   - Railway will automatically deploy when you push to your repository
   - The deployment process takes about 2-3 minutes
   - Once deployed, Railway provides a public URL (e.g., `ragevfx-production.up.railway.app`)

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd /path/to/RageVFX
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

## Project Structure for Deployment

The following files are used for Railway deployment:

- **`server.js`** - Production Express server that serves static files
- **`railway.json`** - Railway configuration file
- **`nixpacks.toml`** - Build configuration for Nixpacks (Railway's build system)
- **`package.json`** - Contains the `start` script and dependencies

## Configuration Files

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### nixpacks.toml
```toml
[phases.setup]
nixPkgs = ["nodejs-20_x"]

[phases.install]
cmds = ["npm ci --include=dev"]

[phases.build]
cmds = ["npm run build:web"]

[start]
cmd = "node server.js"
```

**Note**: The `--include=dev` flag is required in the install phase because vite and other build tools are in devDependencies.

### package.json (relevant scripts)
```json
{
  "scripts": {
    "start": "node server.js",
    "build:web": "vite build"
  },
  "dependencies": {
    "express": "^4.21.2"
  }
}
```

## Local Testing

Before deploying to Railway, test the production setup locally:

```bash
# Build the web app
npm run build:web

# Start the production server
npm start

# Visit http://localhost:3000
```

## Troubleshooting

### Build Fails

**Problem**: Build fails with "vite: not found"
**Solution**: Make sure all devDependencies are installed:
```bash
npm install
npm run build:web
```

### Server Won't Start

**Problem**: Server exits with "Cannot find module 'express'"
**Solution**: Express must be in `dependencies`, not `devDependencies`:
```bash
npm install --save express
```

### Port Issues

**Problem**: App doesn't respond on Railway
**Solution**: The server listens on `process.env.PORT || 3000` and binds to `0.0.0.0`. Railway automatically sets the PORT environment variable.

### Static Files Not Loading

**Problem**: Assets return 404 errors
**Solution**: Check that `dist-web` directory exists and contains built files:
```bash
ls -la dist-web/
```

### White Page / App Not Loading

**Problem**: The deployed app shows a white page with basic HTML but no interactive UI
**Cause**: This happens when the build step fails silently, resulting in missing JavaScript/CSS assets. Railway sets `NODE_ENV=production` which causes `npm ci` to skip dev dependencies unless explicitly instructed to include them.

**Solution**: Ensure `nixpacks.toml` includes the `--include=dev` flag:
```toml
[phases.install]
cmds = ["npm ci --include=dev"]
```

**Why this is needed**: Vite (the build tool) is a dev dependency. When Railway runs the build in production mode, `npm ci` without `--include=dev` will skip vite, causing `npm run build:web` to fail.

**Verification**: After deployment, check the `/health` endpoint to verify the build completed:
```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "3.11.0",
  "indexExists": true,
  "assetsExists": true,
  "assetCount": 7
}
```

If `assetsExists` is false or `assetCount` is 0, the build failed.

### Cached Old Version

**Problem**: Deployment succeeds but the app shows an old version
**Solution**: 
1. Clear Railway's build cache from the dashboard
2. Trigger a redeploy
3. Check the `/health` endpoint to verify the new version number

## Performance Optimization

### Enable Compression
The server can be enhanced with gzip compression:
```javascript
const compression = require('compression');
app.use(compression());
```

### Add Caching Headers
For production, add cache headers to static files:
```javascript
app.use(express.static(DIST_DIR, {
  maxAge: '1d',
  etag: true
}));
```

## Monitoring

After deployment, monitor your application:

1. **Railway Dashboard**: View logs, metrics, and deployment status
2. **Application Logs**: Check for errors in the Railway logs
3. **Health Check Endpoint**: The app provides a `/health` endpoint for monitoring
   - Access: `https://your-app.railway.app/health`
   - Returns: JSON with version, build status, and asset information
   - Example response:
   ```json
   {
     "status": "ok",
     "version": "3.11.0",
     "distDir": "/app/dist-web",
     "indexExists": true,
     "assetsExists": true,
     "assetCount": 7,
     "timestamp": "2026-01-07T14:00:00.000Z",
     "nodeEnv": "production"
   }
   ```
   - Use this to verify deployments and monitor build status
4. **Railway Health Checks**: Railway automatically performs health checks on the root endpoint

## Custom Domain

To use a custom domain:

1. Go to your Railway project settings
2. Navigate to "Domains"
3. Click "Add Domain"
4. Enter your custom domain (e.g., `app.ragevfx.com`)
5. Update your DNS records as instructed by Railway

## Scaling

Railway supports horizontal scaling:

1. Go to project settings
2. Adjust the number of replicas in `railway.json`
3. Redeploy the application

## Cost Considerations

Railway offers:
- **Free Tier**: $5 of usage credit per month
- **Hobby Plan**: $5/month for additional resources
- **Pro Plan**: $20/month for production applications

The RageVFX web app is a static site served by a lightweight Node.js server, so it should run comfortably within the free tier limits for moderate traffic.

## Support

For deployment issues:
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [RageVFX GitHub Issues](https://github.com/mllinman/RageVFX/issues)

## Additional Resources

- [Railway Deployment Guide](https://docs.railway.app/deploy/deployments)
- [Nixpacks Documentation](https://nixpacks.com/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
