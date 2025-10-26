# 🌪️ Tornado MCP Client - Development Guide

This guide explains how to set up, develop, and build the Tornado MCP Client.

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/gzzydevs/tornado-mcp-client.git
cd tornado-mcp-client
```

2. Install dependencies:
```bash
npm install
```

## Development

### Running in Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

This will:
- Start Vite dev server on port 5173
- Launch Electron with the transparent overlay window
- Enable hot module replacement (HMR) for React components
- Open DevTools automatically

### Project Structure

```
tornado-mcp-client/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Main entry point
│   │   ├── preload.ts     # Preload script for secure IPC
│   │   └── tsconfig.json  # TypeScript config for main process
│   ├── renderer/          # React renderer process
│   │   ├── App.tsx        # Main React component
│   │   ├── App.css        # Component styles
│   │   ├── main.tsx       # Renderer entry point
│   │   ├── index.css      # Global styles
│   │   ├── types.d.ts     # TypeScript type definitions
│   │   └── tsconfig.json  # TypeScript config for renderer
│   ├── shared/            # Shared code between processes
│   └── db/                # Database related code
├── mcps/                  # MCP server implementations
├── cache/                 # Cache directory
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # Base TypeScript configuration
└── package.json           # Project dependencies and scripts

```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run package` - Package the app for distribution

## Building for Production

### Build the Application

```bash
npm run build
```

This creates optimized bundles in the `dist/` directory:
- `dist/main/` - Compiled main process code
- `dist/renderer/` - Compiled renderer process assets

### Package for Distribution

Create distributable packages:

```bash
npm run package
```

This will use electron-builder to create platform-specific installers in the `release/` directory:
- Windows: `.exe` installer
- macOS: `.dmg` disk image
- Linux: `.AppImage`

## Technology Stack

- **Electron**: Desktop application framework
- **React 19**: UI library with hooks
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **electron-builder**: App packaging and distribution

## Key Features

### Transparent Overlay Window

The main window is configured with:
- `transparent: true` - Enables transparency
- `frame: false` - Removes window frame
- `alwaysOnTop: true` - Stays above other windows

Perfect for game overlays!

### Process Separation

- **Main Process** (`src/main/`): Handles window management, system integration
- **Renderer Process** (`src/renderer/`): Runs React UI
- **Preload Script** (`src/main/preload.ts`): Secure bridge between main and renderer

### Hot Module Replacement (HMR)

During development, changes to React components automatically reload without restarting the app.

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, change it in `vite.config.ts`:

```typescript
server: {
  port: 5174  // Change to any available port
}
```

### Build Errors

Clean the build cache and try again:

```bash
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

## Next Steps

- Implement MCP client integration
- Add database layer with SQLite
- Create game-specific MCP servers
- Build UI components for overlay

## License

AGPL-3.0 with commercial exception (see LICENSE files)
