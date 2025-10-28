# The Connection - Religious Social Platform

A comprehensive religious social platform built with TypeScript, featuring communities, prayer requests, microblogs, events, and user management.

## Tech Stack

**Backend:**
- Node.js with TypeScript
- Express.js server framework
- PostgreSQL database with Drizzle ORM
- Express sessions for authentication

**Frontend:**
- React with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Wouter for routing
- TanStack Query for data fetching

## Quick Start

### Option 1: GitHub Codespaces (Easiest)

Get started in seconds with a pre-configured cloud development environment:

1. Click the **Code** button on the repository
2. Select **Codespaces** tab
3. Click **Create codespace on main**

See the [Codespaces Guide](docs/CODESPACES.md) for detailed instructions.

### Option 2: Local Development

1. **Install Dependencies:**
```bash
npm install
```

2. **Set up Environment Variables:**
Create a `.env` file with:
```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
NODE_ENV=development
```

3. **Set up Database:**
```bash
npm run db:push
```

4. **Start Development Server:**
```bash
npm run dev
```

See the [Local Debugging Guide](docs/LOCAL_DEBUGGING.md) for troubleshooting.

## Features

- User authentication and profiles
- Community management
- Prayer requests and responses
- Microblogging system
- Event scheduling
- Bible study resources
- Admin dashboard
- Real-time features

## Project Structure

- `/server` - Backend API and authentication
- `/client` - React frontend application
- `/shared` - Shared TypeScript schemas and types
- Database migrations and seeding

## Database

Uses PostgreSQL with Drizzle ORM. Run `npm run db:push` to apply schema changes.

## Development

The application serves both frontend and backend on the same port using Vite's development server.