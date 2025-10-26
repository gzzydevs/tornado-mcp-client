# Database Module

This directory contains SQLite database access and data access objects (DAOs) for Tornado MCP Client.

## Purpose

- Database schema definitions
- Data access layer for MCP metadata, caches, and game configurations
- Migration scripts for database updates

## Planned Components

- **schema.ts**: Database schema definitions
- **connection.ts**: Database connection and initialization
- **mcps-dao.ts**: Data access for MCP metadata
- **cache-dao.ts**: Data access for savefile/screenshot/guide caches
- **config-dao.ts**: Data access for game and overlay configurations
