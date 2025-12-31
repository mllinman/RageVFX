# RageVFX Deployment Checklist

Complete checklist for deploying RageVFX applications to production.

## Pre-Deployment Checklist

### Code & Testing
- [ ] All tests passing (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build successful (`npm run build` and `npm run build:web`)
- [ ] No console errors or warnings
- [ ] Code reviewed and approved
- [ ] Security vulnerabilities checked (`npm audit`)
- [ ] Documentation updated

### Configuration
- [ ] Environment variables configured
- [ ] API endpoints set to production URLs
- [ ] Stripe keys updated to production (if applicable)
- [ ] Database connection string verified
- [ ] CDN configured
- [ ] SSL certificates valid
- [ ] Domain names configured

### Infrastructure
- [ ] Hosting platform ready
- [ ] Database backed up
- [ ] Monitoring tools configured
- [ ] Error tracking enabled (Sentry)
- [ ] Analytics configured
- [ ] CDN/caching configured

## Desktop App Deployment

### Windows
- [ ] Build installer: `npm run dist:win`
- [ ] Test installer on clean Windows VM
- [ ] Code signing certificate valid
- [ ] Installer tested (install/uninstall)
- [ ] App launches successfully
- [ ] All features working
- [ ] Upload to GitHub Releases
- [ ] Update download links on website
- [ ] Update version in marketing materials

### macOS
- [ ] Build DMG: `npm run dist:mac`
- [ ] Test on Intel Mac
- [ ] Test on Apple Silicon Mac
- [ ] Code signed and notarized
- [ ] DMG opens correctly
- [ ] App launches without Gatekeeper warnings
- [ ] All features working
- [ ] Upload to GitHub Releases
- [ ] Update download links on website

### Linux
- [ ] Build packages: `npm run dist:linux`
- [ ] Test AppImage on multiple distros
- [ ] Test DEB on Ubuntu/Debian
- [ ] Test RPM on Fedora
- [ ] All features working
- [ ] Upload to GitHub Releases
- [ ] Update download links on website
- [ ] Submit to Flathub (optional)
- [ ] Submit to Snap Store (optional)

### Release Notes
- [ ] Version number updated in package.json
- [ ] CHANGELOG.md updated
- [ ] Release notes written
- [ ] Breaking changes documented
- [ ] Migration guide (if needed)
- [ ] GitHub release created
- [ ] All installers attached to release

## Web App Deployment

### Frontend Deployment (Vercel/Netlify)
- [ ] Build production bundle: `npm run build:web`
- [ ] Preview build locally: `npm run preview:web`
- [ ] Test in all major browsers
- [ ] Test on mobile devices
- [ ] Check lighthouse score (target: >90)
- [ ] Verify subscription integration works
- [ ] Deploy to staging first
- [ ] Test staging environment
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Check CDN cache purged
- [ ] DNS propagation complete (if domain change)

### Backend API Deployment (Railway/Render)
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] Run migrations: `npm run migrate`
- [ ] Test API endpoints
- [ ] Stripe webhooks configured
- [ ] Deploy to staging
- [ ] Run integration tests
- [ ] Deploy to production
- [ ] Verify webhooks working
- [ ] Test subscription flow end-to-end

## Marketing Site Deployment

- [ ] Update version numbers
- [ ] Update download links
- [ ] Update pricing if changed
- [ ] Update feature list
- [ ] Update screenshots/videos
- [ ] Test all links
- [ ] Test payment flow (Stripe test mode)
- [ ] Switch Stripe to live mode
- [ ] Deploy to production
- [ ] Verify forms working
- [ ] Test "Launch App" button

## Post-Deployment Verification

### Immediate (0-15 minutes)
- [ ] Health check endpoints responding
- [ ] Main website loading correctly
- [ ] Web app loading and functional
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] No critical errors in logs
- [ ] Monitoring dashboards showing green
- [ ] Status page updated

### Short-term (15-60 minutes)
- [ ] User signup flow working
- [ ] Login flow working
- [ ] Subscription creation working
- [ ] Desktop downloads working (Pro tier)
- [ ] Web app features working
- [ ] Email notifications sending
- [ ] Stripe webhooks being received
- [ ] Analytics tracking events

### Medium-term (1-4 hours)
- [ ] Monitor error rates (<0.1%)
- [ ] Monitor response times (<200ms p95)
- [ ] Check CPU/memory usage (normal)
- [ ] Review user feedback
- [ ] Check support tickets
- [ ] Monitor social media mentions
- [ ] Verify CDN cache hit ratio (>85%)

### Long-term (24 hours)
- [ ] Daily active users tracking correctly
- [ ] Subscription renewals working
- [ ] Payment processing working
- [ ] License validation working
- [ ] Backups completing successfully
- [ ] No major bugs reported
- [ ] User satisfaction positive

## Rollback Plan

### If Critical Issues Found

**Web App**:
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# Manual
git revert HEAD
git push origin main
```

**Desktop App**:
- Remove download links
- Point to previous version
- Post status update
- Notify affected users

**Backend API**:
```bash
# Railway
railway rollback

# Manual
git revert HEAD
git push origin main
# Redeploy
```

### Rollback Decision Criteria

Rollback immediately if:
- [ ] App completely down
- [ ] Data loss occurring
- [ ] Security vulnerability exposed
- [ ] Payment processing broken
- [ ] Error rate >5%

Consider rollback if:
- [ ] Core features broken
- [ ] Performance degraded >50%
- [ ] Error rate >1%
- [ ] Multiple user complaints

## Communication Plan

### Before Deployment
- [ ] Notify team of deployment window
- [ ] Post scheduled maintenance (if downtime expected)
- [ ] Email enterprise customers (for major changes)

### During Deployment
- [ ] Update status page: "Deployment in progress"
- [ ] Monitor #alerts channel
- [ ] Team on standby

### After Deployment
- [ ] Post success message on status page
- [ ] Tweet/post about new release
- [ ] Email changelog to subscribers
- [ ] Update support documentation
- [ ] Write blog post (for major releases)

### If Issues Occur
- [ ] Update status page immediately
- [ ] Post in #incidents channel
- [ ] Notify affected users
- [ ] Provide ETA for resolution
- [ ] Post post-mortem after resolution

## GitHub Release Checklist

- [ ] Tag created: `git tag v3.11.0`
- [ ] Tag pushed: `git push origin v3.11.0`
- [ ] Release created on GitHub
- [ ] Release title: "RageVFX v3.11.0"
- [ ] Description includes:
  - [ ] New features
  - [ ] Bug fixes
  - [ ] Breaking changes
  - [ ] Known issues
  - [ ] Installation instructions
- [ ] Assets attached:
  - [ ] Windows installer (.exe)
  - [ ] Windows portable (.exe)
  - [ ] macOS DMG (.dmg)
  - [ ] macOS ZIP (.zip)
  - [ ] Linux AppImage (.AppImage)
  - [ ] Linux DEB (.deb)
  - [ ] Linux RPM (.rpm)
- [ ] "Latest Release" badge updated
- [ ] Checksums/signatures provided (optional)

## Security Checklist

- [ ] No secrets in code
- [ ] Environment variables configured
- [ ] HTTPS/SSL enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Helmet.js configured
- [ ] Security headers set
- [ ] Content Security Policy configured
- [ ] Subresource Integrity (SRI) hashes

## Performance Checklist

- [ ] Assets minified
- [ ] Images optimized
- [ ] Gzip/Brotli compression enabled
- [ ] CDN configured
- [ ] Cache headers set appropriately
- [ ] Database queries optimized
- [ ] Indexes created where needed
- [ ] Connection pooling configured
- [ ] Lazy loading implemented
- [ ] Code splitting applied
- [ ] Bundle size reasonable (<1MB)

## Monitoring & Alerts

- [ ] Uptime monitoring configured (UptimeRobot)
- [ ] Error tracking active (Sentry)
- [ ] Analytics tracking (PostHog/Plausible)
- [ ] Performance monitoring (Lighthouse CI)
- [ ] Log aggregation configured
- [ ] Alerts configured:
  - [ ] Application down
  - [ ] High error rate
  - [ ] Slow response times
  - [ ] Payment failures
  - [ ] High CPU/memory
- [ ] On-call engineer assigned
- [ ] Escalation path defined

## Documentation Updates

- [ ] README.md updated
- [ ] CHANGELOG.md updated
- [ ] API documentation updated
- [ ] User manual updated
- [ ] Deployment docs updated
- [ ] Troubleshooting guide updated
- [ ] FAQ updated
- [ ] Tutorial videos updated (if needed)

## Compliance & Legal

- [ ] Privacy policy reviewed
- [ ] Terms of service reviewed
- [ ] Cookie consent working
- [ ] GDPR compliance verified
- [ ] License terms clear
- [ ] Attribution for dependencies
- [ ] Copyright notices updated

## Backup Verification

- [ ] Database backup completed before deployment
- [ ] Backup tested and restorable
- [ ] File backups current
- [ ] Code repository up to date
- [ ] Configuration backups saved
- [ ] Rollback plan documented and tested

## Team Coordination

- [ ] Deployment lead assigned
- [ ] Team notified of deployment time
- [ ] Support team prepared for potential issues
- [ ] On-call schedule updated
- [ ] Post-deployment meeting scheduled
- [ ] Retrospective planned (for major releases)

## Success Criteria

Deployment is successful if:
- [ ] All health checks passing
- [ ] Error rate <0.1%
- [ ] Response times normal
- [ ] User flows working
- [ ] No rollback needed
- [ ] No critical bugs reported
- [ ] Monitoring shows green
- [ ] Team signs off

## Post-Deployment Tasks

### Immediate (Same day)
- [ ] Monitor for 4+ hours
- [ ] Respond to any issues
- [ ] Update status page
- [ ] Notify stakeholders of success

### Next Day
- [ ] Review metrics from first 24h
- [ ] Check user feedback
- [ ] Address any minor issues
- [ ] Update documentation if gaps found

### First Week
- [ ] Weekly metrics review
- [ ] Gather user feedback
- [ ] Plan patch release if needed
- [ ] Update roadmap

### First Month
- [ ] Monthly review
- [ ] Assess feature adoption
- [ ] Plan next release
- [ ] Retrospective meeting

---

## Sign-Off

**Deployment Lead**: _______________ Date: _______

**Engineering Lead**: _______________ Date: _______

**QA Lead**: _______________ Date: _______

**Product Lead**: _______________ Date: _______

---

**Document Version**: 1.0  
**Last Updated**: December 31, 2024  
**Next Review**: After each major deployment
