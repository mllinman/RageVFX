# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 3.11.x  | :white_check_mark: |
| 3.10.x  | :white_check_mark: |
| 3.9.x   | :x:                |
| < 3.9   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in RageVFX, please follow these steps:

1. **Do NOT** open a public issue on GitHub
2. Email the security team at: security@ragevfx.com
3. Include detailed information about the vulnerability:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- We will acknowledge receipt of your vulnerability report within 48 hours
- We will provide an initial assessment within 5 business days
- We will work with you to understand and resolve the issue
- We will release a fix as soon as possible, depending on complexity

## Security Best Practices

When using RageVFX:

### For Desktop App
- Keep your application updated to the latest version
- Be cautious when opening project files from untrusted sources
- Review scripts and custom nodes before execution
- Use secure connections for network rendering

### For Web Version
- Use HTTPS in production environments
- Implement proper Content Security Policy (CSP)
- Sanitize user inputs
- Validate file uploads
- Implement rate limiting for API endpoints

### For Development
- Keep dependencies updated
- Run `npm audit` regularly
- Use environment variables for sensitive data
- Never commit API keys or secrets to version control
- Enable security features in Electron (see below)

## Electron Security

RageVFX follows Electron security best practices:

- Context isolation is enabled
- Node integration is disabled in renderer processes
- Remote module is disabled
- Sandbox mode is enabled where possible
- Content Security Policy is implemented
- WebView tags are not used

## Dependencies

We regularly audit and update our dependencies to address security vulnerabilities. You can check the current security status by running:

```bash
npm audit
```

## Disclosure Policy

When a security issue is fixed, we will:

1. Release a patch version
2. Publish a security advisory on GitHub
3. Credit the reporter (unless they wish to remain anonymous)
4. Update this security policy as needed

## Contact

For security-related inquiries: security@ragevfx.com

For general support: support@ragevfx.com
