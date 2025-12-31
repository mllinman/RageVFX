# RageVFX Application Deployment Guide

Complete guide for deploying RageVFX desktop and web applications across all platforms.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Desktop App Deployment](#desktop-app-deployment)
3. [Web App Deployment](#web-app-deployment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Environment Configuration](#environment-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Development Environment
- **Node.js**: 20.0.0 or higher
- **npm**: 8.0.0 or higher
- **Git**: Latest version
- **Operating System**: Windows 10+, macOS 10.15+, or Linux

### Build Tools (Platform-Specific)
- **Windows**: Visual Studio Build Tools 2019+, Windows SDK
- **macOS**: Xcode Command Line Tools
- **Linux**: build-essential, fakeroot, rpm

### Accounts & Services
- **GitHub**: For version control and releases
- **Stripe**: For payment processing (marketing site)
- **Hosting**: Vercel/Netlify (frontend), Railway/Render (backend)
- **CDN**: Cloudflare or similar (optional, recommended)

### Installation
```bash
# Clone repository
git clone https://github.com/mllinman/RageVFX.git
cd RageVFX

# Install dependencies
npm install

# Verify build
npm run build
```

---

## Desktop App Deployment

### Building Desktop Apps

The desktop application is built using Electron and electron-builder, supporting Windows, macOS, and Linux.

#### 1. Windows Deployment

**Build NSIS Installer + Portable**:
```bash
npm run dist:win
```

**Output Files** (in `release/` directory):
- `RageVFX Setup 3.11.0.exe` - NSIS installer (recommended)
- `RageVFX-Portable-3.11.0.exe` - Portable version (no install)
- `.blockmap` files - For differential updates

**NSIS Installer Features**:
- Per-machine installation
- Custom install directory
- Desktop & Start Menu shortcuts
- Uninstaller included
- License agreement (LICENSE file)
- Auto-updates support (future)

**Testing Windows Build**:
```bash
# Test on clean Windows VM
# Install and verify:
# - Installation completes successfully
# - App launches without errors
# - All features work (file open, node creation, rendering)
# - Uninstaller works correctly
```

**Code Signing** (Recommended for Production):
```bash
# Get code signing certificate
# Install certificate on build machine

# Set environment variables
set CSC_LINK=path/to/certificate.pfx
set CSC_KEY_PASSWORD=your_password

# Build with signing
npm run dist:win
```

**Distribution**:
- Upload to GitHub Releases
- Host on website download page
- Distribute via Microsoft Store (future)

#### 2. macOS Deployment

**Build DMG + ZIP**:
```bash
npm run dist:mac
```

**Output Files**:
- `RageVFX-3.11.0.dmg` - Disk image (recommended)
- `RageVFX-3.11.0-mac.zip` - ZIP archive
- `-universal.dmg` - Universal binary (Intel + Apple Silicon)

**DMG Features**:
- Drag-and-drop installation
- Custom background image
- Application icon
- License agreement

**Code Signing & Notarization** (Required for Distribution):
```bash
# Prerequisites:
# - Apple Developer account ($99/year)
# - Developer ID Application certificate
# - App-specific password for notarization

# Set environment variables
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=app-specific-password
export CSC_LINK=path/to/certificate.p12
export CSC_KEY_PASSWORD=certificate_password

# Build, sign, and notarize
npm run dist:mac

# Verify notarization
spctl -a -vvv -t install /Applications/RageVFX.app
```

**Distribution**:
- Upload to GitHub Releases
- Host on website download page
- Distribute via Mac App Store (future)

**Testing macOS Build**:
```bash
# Test on Intel and Apple Silicon Macs
# Verify:
# - DMG opens and mounts correctly
# - Drag-and-drop installation works
# - App launches without Gatekeeper warnings
# - All features work correctly
# - App can be moved to Applications folder
```

#### 3. Linux Deployment

**Build AppImage, DEB, RPM**:
```bash
npm run dist:linux
```

**Output Files**:
- `RageVFX-3.11.0.AppImage` - Universal Linux package (recommended)
- `ragevfx_3.11.0_amd64.deb` - Debian/Ubuntu package
- `ragevfx-3.11.0.x86_64.rpm` - RedHat/Fedora package
- `ragevfx-3.11.0.tar.gz` - Generic tarball

**AppImage** (Recommended):
- Universal format for all Linux distros
- No installation required
- Works out of the box
- Self-contained with all dependencies

**DEB Package** (Debian/Ubuntu):
```bash
sudo dpkg -i ragevfx_3.11.0_amd64.deb
```

**RPM Package** (Fedora/RHEL/CentOS):
```bash
sudo rpm -i ragevfx-3.11.0.x86_64.rpm
```

**Distribution**:
- Upload to GitHub Releases
- Submit to Flathub (Flatpak)
- Submit to Snap Store
- Submit to AUR (Arch User Repository)

**Testing Linux Build**:
```bash
# Test on multiple distros:
# - Ubuntu 22.04 LTS
# - Fedora latest
# - Arch Linux
# - Debian stable

# Verify:
# - AppImage runs without dependencies
# - DEB installs on Ubuntu/Debian
# - RPM installs on Fedora/RHEL
# - All features work correctly
```

#### 4. Build All Platforms

**Build for All Platforms**:
```bash
npm run dist:all
```

**Note**: Cross-platform builds have limitations:
- Build macOS on macOS only
- Build Windows on Windows or macOS (with Wine)
- Build Linux on any platform

**Recommended Approach**:
- Use GitHub Actions for automated builds
- Build each platform on native OS
- Store release artifacts securely

### Desktop App Configuration

**Build Configuration** (`package.json`):
```json
{
  "build": {
    "appId": "com.ragevfx.app",
    "productName": "RageVFX",
    "directories": {
      "output": "release",
      "buildResources": "build"
    },
    "files": [
      "dist/**/*",
      "ui/**/*",
      "node_modules/**/*",
      "package.json"
    ]
  }
}
```

**Icons Required**:
- `build/icon.ico` - Windows (256x256, .ico format)
- `build/icon.icns` - macOS (512x512, .icns format)
- `build/icons/` - Linux (PNG files: 16x16 to 512x512)

**Create Icons**:
```bash
# From a high-res PNG (1024x1024)
# Use electron-icon-builder or online tools

npm install -g electron-icon-builder
electron-icon-builder --input=./icon-source.png --output=./build
```

### Release Process

**1. Version Bump**:
```bash
# Update version in package.json
npm version 3.11.0

# Commit version bump
git add package.json package-lock.json
git commit -m "Bump version to 3.11.0"
git push
```

**2. Build Releases**:
```bash
# Build all platforms
npm run dist:all

# Or build individually
npm run dist:win
npm run dist:mac
npm run dist:linux
```

**3. Create GitHub Release**:
```bash
# Tag the release
git tag v3.11.0
git push origin v3.11.0

# Create release on GitHub
# Upload build artifacts from release/ directory
# Write release notes
```

**4. Publish Release**:
- Attach all build artifacts
- Write detailed release notes
- Include changelog
- Mark as latest release

**Release Notes Template**:
```markdown
# RageVFX v3.11.0

## 🆕 New Features
- Camera Import from Nuke/Maya/Blender
- Camera from Video analysis
- Background Card system

## 🐛 Bug Fixes
- Fixed rendering issue on Windows
- Improved stability

## 📦 Downloads
- Windows: RageVFX Setup 3.11.0.exe
- macOS: RageVFX-3.11.0.dmg
- Linux: RageVFX-3.11.0.AppImage

## 📖 Documentation
See CHANGELOG.md for full details
```

---

## Web App Deployment

The web application provides a free tier accessible in any modern browser.

### Building Web App

**Development Server**:
```bash
npm run dev:web
# Opens at http://localhost:3000
```

**Production Build**:
```bash
npm run build:web
# Output: dist-web/
```

**Preview Production Build**:
```bash
npm run preview:web
```

### Web App Hosting

#### Option 1: Vercel (Recommended)

**Setup**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd web/
vercel

# Follow prompts:
# - Project name: ragevfx-web
# - Framework: Vite
# - Build command: npm run build:web
# - Output directory: dist-web
```

**Production Deployment**:
```bash
vercel --prod
```

**Custom Domain**:
```bash
# Add domain in Vercel dashboard
# Update DNS records:
# - CNAME: app.ragevfx.com → cname.vercel-dns.com
# - Wait for SSL certificate provisioning
```

**Environment Variables**:
- Set in Vercel dashboard under Settings → Environment Variables
- No sensitive keys in web app (all client-side)

#### Option 2: Netlify

**Setup**:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd web/
netlify deploy --prod

# Follow prompts:
# - Site name: ragevfx-web
# - Publish directory: dist-web
```

**netlify.toml Configuration**:
```toml
[build]
  command = "npm run build:web"
  publish = "dist-web"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Option 3: GitHub Pages

**Setup**:
```bash
# Build web app
npm run build:web

# Deploy to gh-pages branch
npm install -g gh-pages
gh-pages -d dist-web
```

**GitHub Repository Settings**:
- Settings → Pages
- Source: Deploy from branch
- Branch: gh-pages / (root)

### Web App Configuration

**Vite Configuration** (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'web',
  build: {
    outDir: '../dist-web',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});
```

**Base Path** (for subdirectory hosting):
```typescript
export default defineConfig({
  base: '/app/', // For https://ragevfx.com/app/
});
```

### Subscription Integration

**Launch App from Website**:

The marketing website integrates with the web app to provide tier-based access.

**Flow**:
1. User visits marketing site: `https://ragevfx.com`
2. Clicks "Launch App" or "Try Web App"
3. Redirected to web app: `https://ragevfx.com/web/` or `https://app.ragevfx.com`
4. Web app checks subscription status
5. Features gated based on tier (Free/Pro/Enterprise)

**Implementation** (See next section for details)

---

## CI/CD Pipeline

### GitHub Actions

**Automated Builds** (`.github/workflows/build.yml`):

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - run: npm run dist:win
      - uses: actions/upload-artifact@v3
        with:
          name: windows-builds
          path: release/*.exe

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - run: npm run dist:mac
      - uses: actions/upload-artifact@v3
        with:
          name: macos-builds
          path: release/*.dmg

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - run: npm run dist:linux
      - uses: actions/upload-artifact@v3
        with:
          name: linux-builds
          path: release/*.AppImage

  release:
    needs: [build-windows, build-macos, build-linux]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            windows-builds/*
            macos-builds/*
            linux-builds/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Web App Deployment** (`.github/workflows/deploy-web.yml`):

```yaml
name: Deploy Web App

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run build:web
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
```

---

## Environment Configuration

### Environment Variables

**Desktop App** (`.env`):
```bash
# Not typically needed for desktop app
# All configuration is local
```

**Web App** (build-time only):
```bash
# No runtime environment variables
# All configuration is compiled into bundle
```

**Backend API** (for subscription management):
```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Database
DATABASE_URL=postgresql://user:pass@host:5432/ragevfx

# Authentication
JWT_SECRET=random_64_char_string
DOWNLOAD_TOKEN_SECRET=random_64_char_string

# Services
API_URL=https://api.ragevfx.com
WEB_APP_URL=https://app.ragevfx.com

# Email (optional)
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@ragevfx.com
```

### Configuration Files

**TypeScript Config** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**Electron Builder** (`package.json`):
```json
{
  "build": {
    "appId": "com.ragevfx.app",
    "productName": "RageVFX",
    "directories": {
      "output": "release",
      "buildResources": "build"
    }
  }
}
```

---

## Monitoring & Maintenance

### Application Monitoring

**Desktop App**:
- Error tracking: Sentry
- Usage analytics: PostHog (privacy-focused)
- Crash reports: Built-in Electron crash reporter

**Web App**:
- Error tracking: Sentry
- Performance: Lighthouse CI
- Analytics: Plausible or PostHog
- Uptime: UptimeRobot

### Maintenance Tasks

**Weekly**:
- Monitor error rates
- Check server uptime
- Review user feedback
- Update documentation

**Monthly**:
- Dependency updates
- Security patches
- Performance optimization
- Backup verification

**Quarterly**:
- Major feature releases
- Infrastructure review
- Cost optimization
- User surveys

### Update Strategy

**Desktop App**:
- Electron auto-updater (future)
- Manual updates via download
- In-app update notifications

**Web App**:
- Automatic deployment on push
- Zero-downtime updates
- Cache busting for new versions

---

## Troubleshooting

### Build Issues

**Problem**: Build fails on Windows
```bash
# Solution: Install Visual Studio Build Tools
npm install --global windows-build-tools
```

**Problem**: Build fails on macOS
```bash
# Solution: Install Xcode Command Line Tools
xcode-select --install
```

**Problem**: electron-builder hangs
```bash
# Solution: Clear cache
rm -rf node_modules
rm package-lock.json
npm install
```

### Deployment Issues

**Problem**: Vercel deployment fails
```bash
# Solution: Check build logs
vercel logs
# Fix issues in vite.config.ts
```

**Problem**: GitHub Actions failing
```bash
# Solution: Check workflow logs
# Verify Node version matches local
# Check for missing secrets
```

### Runtime Issues

**Problem**: App won't start on Windows
```bash
# Solution: Run as administrator
# Check antivirus blocking
# Reinstall app
```

**Problem**: macOS Gatekeeper blocks app
```bash
# Solution: Remove quarantine attribute
xattr -cr /Applications/RageVFX.app
```

---

## Support & Resources

### Documentation
- **User Manual**: docs/USER_MANUAL.md
- **API Documentation**: docs/API.md
- **Architecture**: docs/ARCHITECTURE.md

### Community
- **Discord**: https://discord.gg/ragevfx
- **GitHub Issues**: https://github.com/mllinman/RageVFX/issues
- **Discussions**: https://github.com/mllinman/RageVFX/discussions

### Professional Support
- **Email**: support@ragevfx.com
- **Enterprise**: enterprise@ragevfx.com

---

**Document Version**: 1.0  
**Last Updated**: December 31, 2024  
**Next Review**: Q1 2025
