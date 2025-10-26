# MCP Servers Directory

This directory contains installed MCP (Model Context Protocol) servers for different games.

## Purpose

MCP servers provide game-specific tools and context to the Tornado overlay. Each MCP server must implement the standard tools:

- `analyze_savefile`: Parse and return game savefile data
- `take_screenshot`: Capture or reference game screenshots
- `download_guide`: Download or reference game guides/documentation

## Installation

MCPs can be installed via:
- npm packages (from npm registry or git)
- Local development (symlinked or copied)

## Example Structure

```
mcps/
├── hollow-knight-mcp/
│   ├── package.json
│   ├── index.js
│   └── ...
└── other-game-mcp/
    └── ...
```

## References

- Example MCP: [hollow-knight-mcp](https://github.com/gzzydevs/hollow-knight-mcp/pull/1)
- MCP Protocol: https://modelcontextprotocol.io/
