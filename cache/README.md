# Cache Directory

This directory stores cached data from game MCPs including screenshots, parsed savefiles, and chunked guide data.

## Purpose

- **Screenshots**: Captured game screenshots for analysis
- **Savefiles**: Parsed savefile data in JSON format
- **Guides**: Downloaded and chunked game guides/documentation

## Structure

The cache directory is organized by game/MCP:

```
cache/
├── hollow-knight/
│   ├── screenshots/
│   ├── savefiles/
│   └── guides/
└── other-game/
    └── ...
```

## Cache Management

- Caches are indexed in the SQLite database
- Old caches are cleaned up based on configurable retention policies
- Screenshots and guides may be compressed to save space
