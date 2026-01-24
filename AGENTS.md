# AGENTS.md

This file provides guidance to LLMS when working with code in this repository.

## Project Overview

Virtcon2 is a multiplayer world-building game with real-time synchronization. It uses an Nx monorepo with three main applications and six shared packages.

## Common Commands

```bash
# Start all services (requires Redis running)
npm start

# Start individual services
npm run start-game-server      # Packet router on port 7777
npm run start-api              # GraphQL API on port 7778
npm run start-game             # Game client on port 4200

# Infrastructure
npm run redis                  # Start Redis Docker container

# Code quality
npm run lint                   # ESLint all files
nx test <project>              # Run tests for a specific project
nx build <project>             # Build a specific project
nx graph                       # View dependency graph
```

## Architecture

### Three-Service Architecture

1. **API** (`apps/api`) - GraphQL server (Apollo + Express) for persistent data, authentication, and business logic
2. **Packet Router** (`apps/packet_router`) - Game server with Socket.io for real-time state sync, runs ECS tick loop at 20 TPS
3. **Game** (`apps/game`) - React + Phaser 3 client with UI overlays and 2D rendering

### Shared Packages

- **bytenetc** - Custom Entity Component System (ECS) framework used by both server and client
- **database-postgres** - TypeORM entities and database management
- **network-packet** - Packet types and serialization for Socket.io communication
- **network-world-entities** - Game components (Position, Health, etc.) and entity serialization
- **shared** - Logging utilities, configs, timers
- **static-game-data** - Game configuration and static data

### Data Flow

1. Client connects to packet_router via Socket.io
2. Client sends REQUEST_JOIN packet to join a world
3. Server loads world from PostgreSQL, initializes ECS
4. Server runs systems every tick (50ms), broadcasts SYNC_SERVER_ENTITY packets
5. Client deserializes packets, updates local ECS, Phaser renders the state

### Key Patterns

- Both server and client maintain parallel ECS instances with state synchronized via network packets
- Authentication uses JWT tokens passed in Socket.io handshake headers
- Worlds use a plot system for boundaries and ownership
- Resource clusters spawn using seeded simplex noise

## Infrastructure Requirements

- PostgreSQL on localhost:5432 (database: "virtcon")
- Redis for GraphQL subscriptions (Docker container via `npm run redis`)

## Code Style

- Prettier: 140 char width, trailing commas, single quotes, 2-space tabs
- ESLint with Nx plugin rules

## Additional Documentation

- [ECS System and Network Synchronization](docs/ECS_AND_NETWORK_SYNC.md) - Detailed guide on how the bytenetc ECS framework works and how entities are synchronized between server and client
