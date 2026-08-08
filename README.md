# YTM Linux Desktop

An unofficial, lightweight and security-conscious YouTube Music desktop client for Linux.

YTM Linux Desktop provides a native desktop window for YouTube Music while keeping remote web content isolated from Node.js and Electron APIs.

## Status

Early development.

Current version: `0.3.1`

## Features

- Native Linux desktop window
- Persistent Google / YouTube Music session
- System tray integration
- Multimedia controls
- Single-instance behavior
- Persistent window size and position
- External links open in the system browser
- Chromium sandbox enabled
- Node.js integration disabled
- Context isolation enabled
- Browser permissions denied by default
- No application-level telemetry

## Security model

The YouTube Music renderer runs with:

- `nodeIntegration: false`
- `nodeIntegrationInWorker: false`
- `nodeIntegrationInSubFrames: false`
- `contextIsolation: true`
- `sandbox: true`
- `webSecurity: true`
- `allowRunningInsecureContent: false`

The application does not expose a preload bridge to the YouTube Music renderer.

Top-level navigation is restricted to the YouTube Music and Google Accounts hosts required for normal operation and authentication.

## Authentication

Authentication is handled directly by Google's web interface inside Chromium.

YTM Linux Desktop does not collect, process or store your Google password.

The Chromium session is persisted locally by Electron so you can remain signed in between launches.

## Installation

Prebuilt Linux packages are available from the GitHub Releases page:

https://github.com/bartualperen/ytmusic-linux-desktop/releases/latest

### Debian / Ubuntu / Kubuntu

Download the `.deb` package from the latest release and install it with:

    sudo apt install ./YTM-Linux-Desktop-*-amd64.deb

After installation, launch **YTM Linux Desktop** from your application menu.

### AppImage

Download the AppImage from the latest release, make it executable and run it:

    chmod +x YTM-Linux-Desktop-*-x86_64.AppImage
    ./YTM-Linux-Desktop-*-x86_64.AppImage

Some Linux distributions may require FUSE 2 compatibility libraries to run AppImages.

## Development

Requires Node.js 24.

    git clone https://github.com/bartualperen/ytmusic-linux-desktop.git
    cd ytmusic-linux-desktop
    nvm use
    npm ci
    npm start

## Security check

    node --check src/main.js
    npm audit

## Packaging

Linux packaging is handled by `electron-builder`.

Release formats:

- Debian package (`.deb`)
- AppImage

## Privacy

The application itself contains no custom analytics or telemetry.

YouTube Music and Google services are third-party web services and remain subject to their own privacy policies and service behavior.

See [PRIVACY.md](PRIVACY.md).

## Security

See [SECURITY.md](SECURITY.md).

## Disclaimer

YTM Linux Desktop is an independent, unofficial project.

It is not affiliated with, sponsored by, endorsed by, or otherwise associated with Google LLC or YouTube.

YouTube and YouTube Music are trademarks of their respective owners.

## License

MIT
