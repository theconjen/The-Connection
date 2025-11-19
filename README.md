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

### Local Development

1. **Install Dependencies:**
```bash
pnpm install
```

2. **Set up Environment Variables:**
Create a `.env` file with:
```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
NODE_ENV=development
```

For the web app, copy the example:
```bash
cd apps/web
cp .env.example .env
# Edit .env if needed (defaults to /api which works with Vercel proxy)
```

3. **Set up Database:**
```bash
pnpm run db:push
```

4. **Start Development Server:**
```bash
pnpm run dev
```

### Vercel Deployment

To deploy the web app to Vercel:

1. **Connect Repository to Vercel:**
   - Import your GitHub repository in the Vercel dashboard
   - Vercel will auto-detect the project settings

2. **Set Environment Variables:**
   - Go to Project Settings > Environment Variables
   - Add: `VITE_API_BASE` with value `/api`
   - Apply to: Production and Preview

3. **Deploy:**
   - Push to your main branch or create a PR
   - Vercel will automatically build and deploy

4. **Configure Backend CORS:**
   - On your API server deployment, the CORS is already configured to allow `*.vercel.app` domains
   - No additional configuration needed for Vercel deployments

5. **Verify Deployment:**
   - Open your Vercel URL: `https://your-app.vercel.app`
   - Open browser console and run:
   ```javascript
   fetch('/api/health').then(r => r.json()).then(console.log)
   ```
   - You should see `{"ok": true}` or similar JSON response

📖 **For detailed environment configuration, see [ENVIRONMENT.md](./ENVIRONMENT.md)**

## Features

- User authentication and profiles
- Community management
- Prayer requests and responses
- Microblogging system
- Event scheduling
- Bible study resources
- Admin dashboard
- Real-time features

### Posts vs. Microblogs

- **Posts** are longer-form discussions that belong to communities or groups, support threaded comments, and surface in the forums/feed experiences.
- **Microblogs** are quick status-style updates (think Twitter threads) limited to a few hundred characters and optimized for lightweight engagement in the feed.

## Project Structure

- `/server` - Backend API and authentication
- `/client` - React frontend application
- `/shared` - Shared TypeScript schemas and types
- Database migrations and seeding

## Database

Uses PostgreSQL with Drizzle ORM. Run `pnpm run db:push` to apply schema changes.

## Development

The application serves both frontend and backend on the same port using Vite's development server.

### Testing

- Web E2E tests are documented in `apps/web/TESTING.md` (use test IDs only; install the fetch stub before navigation; tests run with a blank API base).
gd