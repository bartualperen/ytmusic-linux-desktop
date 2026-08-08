# Security Policy

Security is a core design goal of YTM Linux Desktop.

## Reporting a vulnerability

Do not publicly disclose an unpatched vulnerability, authentication token, cookie or session information in a GitHub issue.

Prefer GitHub Private Vulnerability Reporting when it is available for this repository.

## Security design

The remote YouTube Music renderer does not receive Node.js access.

Important Electron protections include:

- Chromium sandbox enabled
- Node integration disabled
- Context isolation enabled
- Web security enabled
- Insecure mixed content disabled
- No renderer preload bridge
- Restricted top-level navigation
- Browser permissions denied by default
- Generic file downloads blocked

Changes that weaken these protections should receive additional review.
