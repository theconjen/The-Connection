# CLAUDE.md - AI Assistant Guide for The Connection

**Last Updated**: 2025-11-15
**Project**: The Connection - Christian Social Platform
**Repository**: https://github.com/The-Connection-App/The-Connection

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Repository Structure](#repository-structure)
4. [Development Workflows](#development-workflows)
5. [Code Conventions](#code-conventions)
6. [Database Schema](#database-schema)
7. [API Architecture](#api-architecture)
8. [Frontend Architecture](#frontend-architecture)
9. [Security Guidelines](#security-guidelines)
10. [Testing Strategy](#testing-strategy)
11. [Deployment](#deployment)
12. [Common Tasks](#common-tasks)
13. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is The Connection?

The Connection is a comprehensive **Christian social platform** that provides communities, events, prayer requests, apologetics Q&A, microblogs, and real-time chat. It's built as a modern full-stack TypeScript monorepo with web and mobile applications.

### Key Features

- **Communities**: Create and manage Christian communities with privacy controls
- **Events**: Schedule and RSVP to community events with map integration
- **Prayer Requests**: Submit and respond to prayer requests
- **Microblogs**: Twitter-like short posts for quick updates
- **Apologetics Q&A**: Platform for theological questions and answers
- **Real-time Chat**: Socket.IO-powered community chat rooms and DMs
- **Organizations**: Church and ministry management
- **User Profiles**: Customizable profiles with interests and denominations
- **Admin Dashboard**: Comprehensive admin controls

### Feature Flags

The codebase uses feature flags defined in `/shared/features.ts`:

**Enabled Features:**
- `AUTH` - Authentication system
- `FEED` - Activity feed
- `POSTS` - Forum posts
- `COMMUNITIES` - Community management
- `EVENTS` - Event system
- `APOLOGETICS` - Q&A system

**Disabled Features:**
- `ORGS` - Organizations (partial implementation)
- `PAYMENTS` - Payment processing
- `NOTIFICATIONS` - Push notifications (partial)
- `RECOMMENDATIONS` - Personalized recommendations (partial)

**⚠️ Important**: Always check feature flags before implementing features. Use `FEATURES.AUTH`, `FEATURES.COMMUNITIES`, etc.

---

## Technology Stack

### Backend

- **Runtime**: Node.js >= 22.0.0
- **Language**: TypeScript 5.9.3
- **Framework**: Express 5.1.0
- **Database**: PostgreSQL via Neon serverless (@neondatabase/serverless)
- **ORM**: Drizzle ORM 0.44.7 with Zod validation
- **Build Tool**: esbuild 0.27.0
- **Authentication**:
  - express-session with connect-pg-simple (PostgreSQL session store)
  - Passport.js for strategies
  - bcryptjs for password hashing (12 salt rounds)
  - jsonwebtoken for JWTs
- **Security**:
  - Helmet.js - Security headers
  - Lusca - CSRF protection
  - express-rate-limit - Rate limiting
  - DOMPurify - XSS protection
- **Real-time**: Socket.IO 4.8.1
- **Email**: AWS SES (@aws-sdk/client-ses), SendGrid (@sendgrid/mail)
- **File Storage**: Google Cloud Storage (@google-cloud/storage)
- **AI**: Anthropic SDK 0.68.0

### Frontend

- **Framework**: React 19.1.0
- **Build Tool**: Vite 7.2.2
- **Language**: TypeScript 5.9.3
- **Routing**: Wouter 3.7.1 (lightweight React Router alternative)
- **State Management**: TanStack Query 5.90.9 (React Query)
- **UI Library**: Radix UI (comprehensive component suite)
- **Styling**: Tailwind CSS 3.4.18 with tailwindcss-animate
- **Forms**: React Hook Form 7.66.0 with Zod validation
- **Maps**: Leaflet 1.9.4 with react-leaflet 5.0.0
- **Icons**: Lucide React 0.553.0
- **File Uploads**: Uppy (@uppy/*)
- **PWA**: vite-plugin-pwa 1.1.0
- **Date Handling**: date-fns 4.1.0
- **Internationalization**: i18next 25.6.2 with ICU support

### Mobile

- **Framework**: React Native via Expo
- **Capacitor**: 7.4.4 for native capabilities
- **Push Notifications**: expo-server-sdk 4.0.0

### Testing

- **Unit/Integration**: Vitest 4.0.9
- **API Testing**: Supertest 7.1.4
- **E2E**: Playwright (in apps/web)
- **Environment**: jsdom 27.2.0

### Package Management

- **Manager**: pnpm 10.16.1
- **Workspace**: Monorepo with pnpm workspaces

---

## Repository Structure

```
The-Connection/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Radix UI design system components
│   │   │   ├── admin/       # Admin dashboard components
│   │   │   ├── community/   # Community feature components
│   │   │   ├── events/      # Event components
│   │   │   └── moderation/  # Content moderation components
│   │   ├── pages/           # Page components (route-level)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility libraries
│   │   └── contexts/        # React contexts (auth, etc.)
│   └── public/              # Static assets
│
├── server/                   # Express backend application
│   ├── routes/              # API route handlers
│   │   ├── api/            # Nested API routes
│   │   │   ├── auth.ts     # Authentication endpoints
│   │   │   ├── admin.ts    # Admin endpoints
│   │   │   ├── user.ts     # User management
│   │   │   └── support.ts  # Support endpoints
│   │   ├── auth.ts         # Auth routes module
│   │   ├── communities.ts  # Communities module
│   │   ├── events.ts       # Events module
│   │   ├── posts.ts        # Forum posts module
│   │   ├── feed.ts         # Activity feed module
│   │   └── apologetics.ts  # Apologetics Q&A module
│   ├── services/            # Business logic services
│   ├── middleware/          # Custom middleware
│   ├── config/             # Configuration files
│   ├── db/                 # Database helpers
│   └── personalization/    # Recommendation engine
│
├── shared/                   # Shared code (client + server)
│   ├── schema.ts            # Drizzle ORM database schema (1,420 lines)
│   ├── features.ts          # Feature flags configuration
│   ├── api.ts               # API type definitions
│   ├── services/            # Shared services
│   ├── i18n/               # Internationalization (en, es)
│   └── theme/              # Design tokens
│
├── mobile-app/              # React Native mobile app
│   └── TheConnectionMobile/
│       ├── app/            # File-based routing screens
│       │   ├── (tabs)/    # Tab navigation
│       │   ├── (auth)/    # Auth screens
│       │   └── communities/, events/, messages/
│       └── components/     # Mobile components
│
├── apps/                    # Workspace apps
│   └── web/                # Standalone web app
│       └── tests/          # Playwright E2E tests
│
├── tests/                   # Test suites
│   ├── unit/               # Unit tests
│   ├── api/                # API integration tests
│   └── integration/        # Full integration tests
│
├── migrations/              # Database migrations
├── scripts/                 # Build and utility scripts
├── docs/                    # Documentation
└── public/                  # Public static files

Configuration Files:
├── package.json             # Root package with scripts
├── pnpm-workspace.yaml      # Workspace configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── drizzle.config.ts        # Drizzle ORM configuration
├── vitest.config.ts         # Vitest test configuration
├── .eslintrc.cjs           # ESLint configuration
├── Dockerfile               # Docker build configuration
└── render.yaml              # Render.com deployment config
```

### Important Path Aliases

Defined in `tsconfig.json`:

```typescript
"@/*"       → "/client/src/*"
"@shared/*" → "/shared/*"
```

**Usage Example:**
```typescript
import { Button } from "@/components/ui/button"
import { users } from "@shared/schema"
import { FEATURES } from "@shared/features"
```

---

## Development Workflows

### Initial Setup

```bash
# 1. Install dependencies (uses pnpm workspace)
pnpm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with required values (see Environment Variables section)

# 3. Set up database
pnpm run db:push  # Push schema to database

# 4. (Optional) Seed database
node server/seed-all.ts
```

### Development Server

```bash
# Start development server (Vite + Express)
pnpm run dev
```

**What happens:**
- Vite dev server starts on port 5173 (frontend with HMR)
- Express API server runs on port 5000
- Vite proxies `/api` requests to Express
- Hot module replacement enabled for React components

### Building for Production

```bash
# Build everything
pnpm run build

# Or build separately
pnpm run build:web      # Build React app (Vite)
pnpm run build:server   # Build Express server (esbuild)
```

**Build outputs:**
- Web: `/dist/public` (Vite output)
- Server: `/dist-server/index.cjs` (esbuild CommonJS bundle)

### Database Operations

```bash
# Push schema changes to database
pnpm run db:push

# Generate migrations
pnpm drizzle-kit generate

# Run migrations
node server/run-migrations.ts

# Seed database
node server/seed-all.ts
```

### Testing

```bash
# Run API tests
pnpm test:api

# Run Playwright E2E tests (in apps/web)
cd apps/web
pnpm test
```

### Mobile Development

```bash
# Start mobile app
./start-mobile.sh

# Or use EAS CLI
pnpm run eas
```

### Available Scripts

From root `package.json`:

- `pnpm run watch` - esbuild watch mode
- `pnpm run build:web` - Build web client
- `pnpm run build:server` - Build server
- `pnpm run build` - Build both
- `pnpm test:api` - Run API tests
- `pnpm run eas` - Expo Application Services CLI

---

## Code Conventions

### TypeScript Standards

1. **Strict Mode**: TypeScript strict mode is enabled
2. **Type Safety**: Prefer explicit types over `any`
3. **Zod Validation**: Use Zod schemas for runtime validation
4. **Shared Types**: Define shared types in `/shared/schema.ts`

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Routes: `kebab-case.ts` or feature name (e.g., `user-settings.ts`, `auth.ts`)
- Tests: `*.test.ts` or `*.spec.ts`

**Code:**
- Components: `PascalCase` (e.g., `UserProfile`)
- Functions: `camelCase` (e.g., `getUserById`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_LOGIN_ATTEMPTS`)
- Database tables: `camelCase` (e.g., `users`, `communityMembers`)
- Interfaces/Types: `PascalCase` with descriptive names

### Component Structure

**React Components:**
```typescript
// Imports
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"

// Types
interface UserProfileProps {
  userId: number
}

// Component
export function UserProfile({ userId }: UserProfileProps) {
  // 1. Hooks
  const { data, isLoading } = useQuery(/* ... */)
  const [state, setState] = useState()

  // 2. Event handlers
  const handleClick = () => {
    // ...
  }

  // 3. Early returns
  if (isLoading) return <div>Loading...</div>

  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### API Route Structure

**Express Routes:**
```typescript
// Imports
import { Router } from 'express'
import { isAuthenticated } from '../middleware/auth'
import { storage } from '../storage'

// Router setup
const router = Router()

// Route handlers
router.get('/endpoint', isAuthenticated, async (req, res) => {
  try {
    // 1. Extract and validate input
    const userId = req.session.userId

    // 2. Business logic
    const data = await storage.getUser(userId)

    // 3. Return response
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
```

### Styling Guidelines

**Tailwind CSS:**
- Use Tailwind utility classes
- Extract repeated patterns into components
- Use `cn()` utility for conditional classes
- Leverage design tokens from `/shared/theme/`

**Example:**
```typescript
import { cn } from "@/lib/utils"

<Button
  className={cn(
    "base-classes",
    isActive && "active-classes",
    className
  )}
/>
```

### Error Handling

**Client-side:**
```typescript
import { useToast } from "@/hooks/use-toast"

const { toast } = useToast()

try {
  // Operation
} catch (error) {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive"
  })
}
```

**Server-side:**
```typescript
try {
  // Operation
} catch (error) {
  console.error('Detailed error for debugging:', error)
  res.status(500).json({
    error: 'Generic user-facing message'
  })
}
```

### Security Best Practices

1. **Never expose sensitive data** in error messages
2. **Always validate input** on the server (use Zod schemas)
3. **Sanitize user input** using DOMPurify (see `/server/xss-protection.ts`)
4. **Use parameterized queries** (Drizzle ORM handles this)
5. **Check authentication** on protected routes (use `isAuthenticated` middleware)
6. **Log security events** using audit logger (`/server/audit-logger.ts`)

### Testing Conventions

**Test File Location:**
- Place tests near the code they test, or in `/tests/` directory
- Use descriptive test names

**Test Structure:**
```typescript
import { describe, it, expect } from 'vitest'

describe('Feature name', () => {
  it('should do something specific', async () => {
    // Arrange
    const input = {}

    // Act
    const result = await functionUnderTest(input)

    // Assert
    expect(result).toBe(expected)
  })
})
```

**Playwright Tests:**
- **Use `getByTestId()` exclusively** - never use `getByText()` for i18n safety
- This is enforced by ESLint rule in `.eslintrc.cjs`

---

## Database Schema

### ORM: Drizzle

The database schema is defined in `/shared/schema.ts` (1,420 lines).

### Key Tables

**Users & Authentication:**
- `users` - User accounts (id, username, email, passwordHash, role, loginAttempts, lockoutUntil)
- `sessions` - Express session storage
- `auditLogs` - Security audit trail

**Communities:**
- `communities` - Community definitions (id, name, slug, description, privacySetting)
- `communityMembers` - Membership (communityId, userId, role, joinedAt)
- `communityChatRooms` - Chat rooms (id, communityId, name)
- `chatMessages` - Messages (id, roomId, userId, content, timestamp)

**Content:**
- `posts` - Forum posts (id, userId, communityId, title, content, createdAt)
- `comments` - Post comments
- `microblogs` - Short posts (id, userId, content, createdAt)
- `events` - Events (id, communityId, title, description, startTime, endTime, location)
- `prayerRequests` - Prayer requests (id, userId, communityId, content)
- `apologeticsQuestions` - Q&A questions
- `apologeticsAnswers` - Q&A answers

**Organizations:**
- `organizations` - Churches/ministries
- `organizationMembers` - Organization membership

**Social:**
- `userFollows` - User following relationships
- `blockedUsers` - User blocking
- `eventAttendees` - Event RSVPs

**Notifications:**
- `notifications` - User notifications
- `pushTokens` - Push notification device tokens

### Database Helpers

Located in `/server/db/`:
- Connection pooling
- Query builders
- Transaction helpers

### Migrations

Located in `/migrations/`:
- Migration files numbered sequentially
- Run with: `node server/run-migrations.ts`

---

## API Architecture

### Route Organization

Routes are organized by feature and registered in `/server/routes.ts`.

### Main Route Groups

**Authentication** (`/server/routes/auth.ts`, `/server/routes/api/auth.ts`):
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/magic-code` - Magic link authentication

**User Management** (`/server/routes/api/user.ts`):
- `GET /api/user` - Get current user
- `PUT /api/user` - Update user profile
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user profile

**Communities** (`/server/routes/communities.ts`):
- `GET /api/communities` - List communities
- `POST /api/communities` - Create community
- `GET /api/communities/:slug` - Get community details
- `PUT /api/communities/:id` - Update community
- `DELETE /api/communities/:id` - Delete community
- `GET /api/communities/:id/members` - Get members
- `POST /api/communities/:id/members` - Add member
- `DELETE /api/communities/:id/members/:userId` - Remove member

**Events** (`/server/routes/events.ts`):
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/rsvp` - RSVP to event

**Posts** (`/server/routes/posts.ts`):
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

**Feed** (`/server/routes/feed.ts`):
- `GET /api/feed` - Get activity feed

**Apologetics** (`/server/routes/apologetics.ts`):
- Q&A endpoints for apologetics content

**Admin** (`/server/routes/api/admin.ts`):
- `GET /api/admin/*` - Admin dashboard endpoints
- Requires `isAdmin` middleware

### Middleware

**Authentication:**
- `isAuthenticated` - Requires valid session
- `isAdmin` - Requires admin role
- Located in `/server/auth.ts`

**Rate Limiting:**
- Global: 100 requests per 15 minutes per IP
- Login: 5 attempts per 15 minutes per IP
- Registration: 3 attempts per hour per IP
- Message creation: Custom limits

**Security:**
- Helmet.js - Security headers
- Lusca - CSRF protection
- CORS - Configured for specific origins

### Real-time (Socket.IO)

**Events:**
- `join_room` - Join chat room
- `leave_room` - Leave chat room
- `new_message` - New message in room
- `send_dm` - Send direct message

**Authentication:**
- Socket connections must provide valid `userId`
- Users verified for room access

### API Response Patterns

**Success:**
```json
{
  "data": { /* ... */ }
}
```

**Error:**
```json
{
  "error": "User-friendly error message"
}
```

**Status Codes:**
- 200: Success
- 201: Created
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Internal server error

---

## Frontend Architecture

### Routing (Wouter)

Routes defined with lazy loading in `/client/src/main.tsx` or equivalent.

**Key Routes:**
- `/` - Home page
- `/auth` - Authentication pages
- `/microblogs` - Microblog feed
- `/communities` - Community browser
- `/communities/:slug` - Community detail
- `/events` - Events calendar
- `/apologetics` - Apologetics resources
- `/admin/*` - Admin dashboard

### State Management

**TanStack Query** for server state:
```typescript
import { useQuery, useMutation } from "@tanstack/react-query"

const { data, isLoading } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId)
})

const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries(['users'])
  }
})
```

**React Context** for global state:
- Auth context (`/client/src/contexts/auth`)
- Theme context
- Located in `/client/src/contexts/`

### Custom Hooks

Located in `/client/src/hooks/`:

- `use-auth` - Authentication state and methods
- `use-toast` - Toast notifications
- `use-chat-websocket` - Socket.IO chat integration
- `use-mobile` - Mobile device detection
- `use-blocked-users` - User blocking functionality
- `use-recommendations` - Personalized content

### UI Components

Located in `/client/src/components/ui/`:

Complete Radix UI component library with Tailwind styling:
- Layout: Card, Separator, Scroll Area
- Forms: Button, Input, Checkbox, Select, Radio Group, Switch, Slider
- Feedback: Alert, Toast, Dialog, Alert Dialog
- Navigation: Tabs, Accordion, Navigation Menu, Menubar
- Data: Table, Avatar, Badge, Progress
- Overlays: Popover, Dropdown Menu, Context Menu, Tooltip, Hover Card

**Usage:**
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>
    <Button>Click me</Button>
  </CardContent>
</Card>
```

### Feature Components

Located in `/client/src/components/`:

- `admin/` - Admin dashboard components
- `community/` - Community features (feed, chat, members)
- `events/` - Event list, calendar, map
- `moderation/` - Content moderation tools
- `layouts/` - Page layouts

### Form Handling

**React Hook Form + Zod:**
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  username: z.string().min(3),
  email: z.string().email()
})

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { username: "", email: "" }
})

const onSubmit = form.handleSubmit((data) => {
  // Handle form submission
})
```

### Internationalization (i18n)

**i18next with ICU:**
- Locales: English (en), Spanish (es)
- Translation files in `/shared/i18n/`
- ICU message format support

**Usage:**
```typescript
import { useTranslation } from 'react-i18next'

const { t } = useTranslation()

<p>{t('welcome.message', { name: 'John' })}</p>
```

---

## Security Guidelines

### Authentication Security

**Password Requirements:**
- Minimum 12 characters
- Uppercase + lowercase letters
- Numbers
- Special characters
- Hashed with bcrypt (12 salt rounds)

**Account Protection:**
- Account lockout after 5 failed login attempts
- Lockout duration: 15 minutes
- Sessions expire after 7 days
- Sessions stored in PostgreSQL

### Rate Limiting

**Configured limits:**
- Global: 100 requests per 15 minutes per IP
- Login: 5 attempts per 15 minutes per IP
- Registration: 3 attempts per hour per IP
- Magic code requests: 5 per 15 minutes per IP
- Magic code verification: 10 per 15 minutes per IP

### XSS Protection

**DOMPurify Sanitization:**
- All user-generated content sanitized
- Import from `/server/xss-protection.ts`
- Applies to: profiles, communities, posts, comments, microblogs, events, prayer requests, chat messages

**Usage:**
```typescript
import { sanitizeUserInput } from './xss-protection'

const cleanContent = sanitizeUserInput(userInput)
```

### Security Headers

**Helmet.js configuration:**
- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security (HSTS)
- X-XSS-Protection
- Referrer-Policy

### Audit Logging

All security-sensitive operations logged to `audit_logs` table:
- Login attempts (successful/failed)
- Logout events
- User registration
- Password changes
- Admin actions
- User blocking
- Security setting changes

**Usage:**
```typescript
import { logAuditEvent } from './audit-logger'

await logAuditEvent({
  userId,
  action: 'login_success',
  ipAddress: req.ip,
  userAgent: req.get('user-agent')
})
```

### Environment Variables

**Required (Production):**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (generate with: `openssl rand -base64 32`)
- `JWT_SECRET` - JWT token secret (generate with: `openssl rand -base64 32`)
- `NODE_ENV=production`
- `COOKIE_SECURE=true`
- `USE_DB=true` - Use database for sessions

**Optional:**
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - AWS SES
- `SENDGRID_API_KEY` - SendGrid email
- `GOOGLE_CLOUD_*` - GCS file storage
- `SENTRY_DSN` - Error tracking

**⚠️ Security Warnings:**
1. Never commit `.env` files (already in `.gitignore`)
2. Never hardcode credentials
3. Use environment variables for all secrets
4. Rotate secrets regularly

### CSRF Protection

Enabled via Lusca middleware on all state-changing operations.

### SQL Injection Prevention

Drizzle ORM uses parameterized queries automatically. Never concatenate user input into SQL.

---

## Testing Strategy

### Test Organization

**Directory Structure:**
- `/tests/unit/` - Unit tests
- `/tests/api/` - API integration tests
- `/tests/integration/` - Full integration tests
- `/apps/web/tests/` - Playwright E2E tests

### Unit Testing (Vitest)

**Example:**
```typescript
import { describe, it, expect } from 'vitest'
import { formatDate } from './utils'

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2025-01-15')
    expect(formatDate(date)).toBe('Jan 15, 2025')
  })
})
```

### API Testing (Supertest + Vitest)

**Example:**
```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server/app'

describe('GET /api/users', () => {
  it('should return user list', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200)

    expect(response.body).toHaveProperty('users')
  })
})
```

### E2E Testing (Playwright)

**Important Rules:**
- ✅ **ALWAYS use `getByTestId()`** for selectors
- ❌ **NEVER use `getByText()`** - breaks i18n
- This is enforced by ESLint in `.eslintrc.cjs`

**Example:**
```typescript
import { test, expect } from '@playwright/test'

test('should login successfully', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('login-button').click()
  await page.getByTestId('email-input').fill('user@example.com')
  await page.getByTestId('password-input').fill('password')
  await page.getByTestId('submit-button').click()

  await expect(page.getByTestId('user-menu')).toBeVisible()
})
```

### Running Tests

```bash
# API tests
pnpm test:api

# E2E tests (in apps/web)
cd apps/web
pnpm test
```

---

## Deployment

### Environment Targets

1. **Vercel** - Web app deployment
2. **Render.com** - Backend deployment (configured in `render.yaml`)
3. **Expo EAS** - Mobile app deployment
4. **Docker** - Container deployment

### Docker Deployment

**Multi-stage build:**
```bash
# Build image
docker build -f Dockerfile.prod -t the-connection .

# Run container
docker-compose up
```

**Files:**
- `Dockerfile` - Development Docker image
- `Dockerfile.prod` - Production Docker image
- `Dockerfile.local` - Local development
- `docker-compose.yml` - Container orchestration

### Vercel Deployment

**Steps:**
1. Connect repository to Vercel
2. Set environment variable: `VITE_API_BASE=/api`
3. Push to main branch or create PR
4. Vercel auto-builds and deploys

**CORS:** Already configured for `*.vercel.app` domains

### Render.com Deployment

Configured in `render.yaml`:
- Web service for backend
- PostgreSQL database
- Environment variables via Render dashboard

### Production Deployment Script

```bash
./deploy-production.sh
```

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build successful locally
- [ ] Security audit complete
- [ ] Secrets rotated
- [ ] SSL/TLS certificates valid
- [ ] CORS configured correctly
- [ ] Rate limits appropriate
- [ ] Error tracking enabled (Sentry)

---

## Common Tasks

### Adding a New API Endpoint

1. **Create route handler** in appropriate file (e.g., `/server/routes/communities.ts`)
2. **Add middleware** (authentication, rate limiting)
3. **Implement business logic**
4. **Add input validation** (Zod schema)
5. **Sanitize user input** (XSS protection)
6. **Register route** in `/server/routes.ts`
7. **Add tests** in `/tests/api/`

**Example:**
```typescript
// In /server/routes/communities.ts
router.post('/', isAuthenticated, async (req, res) => {
  try {
    // 1. Validate input
    const schema = z.object({
      name: z.string().min(3),
      description: z.string()
    })
    const data = schema.parse(req.body)

    // 2. Sanitize
    const cleanData = {
      name: sanitizeUserInput(data.name),
      description: sanitizeUserInput(data.description)
    }

    // 3. Create resource
    const community = await storage.createCommunity({
      ...cleanData,
      userId: req.session.userId
    })

    // 4. Return response
    res.status(201).json(community)
  } catch (error) {
    console.error('Error creating community:', error)
    res.status(500).json({ error: 'Failed to create community' })
  }
})
```

### Adding a New React Component

1. **Create component file** in `/client/src/components/`
2. **Define props interface**
3. **Implement component**
4. **Add to index** if creating a component library
5. **Add tests** (if complex logic)

**Example:**
```typescript
// /client/src/components/CommunityCard.tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface CommunityCardProps {
  name: string
  description: string
  onJoin: () => void
}

export function CommunityCard({ name, description, onJoin }: CommunityCardProps) {
  return (
    <Card>
      <CardHeader>{name}</CardHeader>
      <CardContent>
        <p>{description}</p>
        <Button onClick={onJoin}>Join</Button>
      </CardContent>
    </Card>
  )
}
```

### Adding a Database Table

1. **Define schema** in `/shared/schema.ts` using Drizzle
2. **Create migration** (if needed)
3. **Update storage layer** with CRUD operations
4. **Update TypeScript types**
5. **Push schema**: `pnpm run db:push`

**Example:**
```typescript
// In /shared/schema.ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const newFeature = pgTable('new_feature', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow()
})
```

### Adding Feature Flag

1. **Add flag** to `/shared/features.ts`
2. **Use in routes** to conditionally register
3. **Use in client** to show/hide features

**Example:**
```typescript
// In /shared/features.ts
export const FEATURES = {
  // ... existing flags
  NEW_FEATURE: true,
} as const

// In /server/routes.ts
if (FEATURES.NEW_FEATURE) {
  app.use('/api/new-feature', newFeatureRoutes)
}

// In client
import { FEATURES } from '@shared/features'

{FEATURES.NEW_FEATURE && <NewFeatureComponent />}
```

### Updating Dependencies

```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update package-name

# Check for outdated packages
pnpm outdated

# Audit for security issues
pnpm audit
```

---

## Troubleshooting

### Common Issues

**Issue: "Module not found" errors**
- Check path aliases in `tsconfig.json`
- Verify import paths use `@/` or `@shared/` correctly
- Restart TypeScript server in IDE

**Issue: Database connection errors**
- Verify `DATABASE_URL` in `.env`
- Check database is running
- Ensure network connectivity
- Check Neon serverless quotas

**Issue: Authentication not working**
- Verify `SESSION_SECRET` is set
- Check session store connection (PostgreSQL)
- Verify cookies are being sent (check CORS)
- Check `COOKIE_SECURE` setting matches HTTPS/HTTP

**Issue: Rate limiting blocking requests**
- Check rate limit configuration
- Clear rate limit cache
- Verify IP address detection

**Issue: WebSocket connection failing**
- Verify Socket.IO client configuration
- Check server CORS settings
- Ensure `userId` is being sent
- Check firewall/proxy settings

**Issue: Build failures**
- Clear build cache: `rm -rf dist dist-server node_modules/.vite`
- Reinstall dependencies: `pnpm install`
- Check for TypeScript errors: `tsc --noEmit`
- Verify all imports are correct

**Issue: Tests failing**
- Check test database is seeded
- Verify test environment variables
- Check for port conflicts
- Clear test cache

### Debug Mode

**Enable verbose logging:**
```bash
# Server
DEBUG=* pnpm run dev

# Database queries
DEBUG=drizzle:* pnpm run dev
```

### Performance Issues

**Slow queries:**
- Check database indexes
- Use query profiling
- Optimize N+1 queries with proper joins

**Large bundle size:**
- Check Vite bundle analyzer
- Verify code splitting
- Check for duplicate dependencies

**Slow page loads:**
- Use React DevTools Profiler
- Check network tab for large requests
- Verify lazy loading is working

### Getting Help

1. **Check existing documentation:**
   - README.md
   - SECURITY.md
   - ENVIRONMENT.md
   - This CLAUDE.md file

2. **Review logs:**
   - Server logs for backend issues
   - Browser console for frontend issues
   - Database logs for query issues

3. **Search codebase:**
   - Use grep or IDE search
   - Check similar implementations
   - Review test files for examples

---

## AI Assistant Guidelines

### When Implementing Features

1. **Check feature flags first** - Verify if feature is enabled in `/shared/features.ts`
2. **Follow existing patterns** - Look at similar features for guidance
3. **Security first** - Always validate, sanitize, and authenticate
4. **Test thoroughly** - Write tests for new features
5. **Update documentation** - Keep docs in sync with code changes

### When Debugging

1. **Read error messages carefully** - They often contain the solution
2. **Check recent changes** - What changed before the issue appeared?
3. **Verify environment** - Are environment variables set correctly?
4. **Use logging** - Add strategic console.log or debug statements
5. **Reproduce consistently** - Understand exact steps to trigger issue

### When Reviewing Code

1. **Security review** - Check for XSS, SQL injection, authentication bypasses
2. **Performance review** - Look for N+1 queries, large bundle increases
3. **Type safety** - Ensure proper TypeScript usage
4. **Test coverage** - Verify critical paths are tested
5. **Documentation** - Code comments and external docs updated

### Code Quality Standards

- **No `any` types** without justification
- **Proper error handling** - Don't swallow errors
- **Meaningful names** - Self-documenting code
- **DRY principle** - Don't repeat yourself
- **KISS principle** - Keep it simple
- **Separation of concerns** - Modular, focused functions

---

## Quick Reference

### Key Files to Know

| File | Purpose |
|------|---------|
| `/shared/schema.ts` | Database schema (1,420 lines) |
| `/shared/features.ts` | Feature flags |
| `/server/routes.ts` | Route registration |
| `/server/auth.ts` | Authentication middleware |
| `/server/xss-protection.ts` | XSS sanitization |
| `/server/audit-logger.ts` | Security audit logging |
| `/client/src/main.tsx` | React app entry point |
| `/client/src/components/ui/` | UI component library |
| `package.json` | Scripts and dependencies |
| `vite.config.ts` | Vite configuration |
| `tsconfig.json` | TypeScript configuration |
| `.env` | Environment variables |

### Essential Commands

```bash
# Development
pnpm install              # Install dependencies
pnpm run dev             # Start dev server
pnpm run build           # Build for production

# Database
pnpm run db:push         # Push schema changes
node server/run-migrations.ts  # Run migrations
node server/seed-all.ts  # Seed database

# Testing
pnpm test:api            # Run API tests

# Mobile
./start-mobile.sh        # Start mobile app
pnpm run eas            # EAS CLI

# Deployment
./deploy-production.sh   # Deploy to production
```

### Environment Variables Quick List

```bash
# Required
DATABASE_URL=postgresql://...
SESSION_SECRET=generate-with-openssl-rand
JWT_SECRET=generate-with-openssl-rand
NODE_ENV=development|production

# Optional
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SENDGRID_API_KEY=
GOOGLE_CLOUD_PROJECT=
SENTRY_DSN=
```

---

## Appendix

### Glossary

- **Drizzle ORM** - TypeScript-first ORM for PostgreSQL
- **Wouter** - Lightweight React router (3.7KB)
- **TanStack Query** - Data fetching and caching library
- **Radix UI** - Unstyled, accessible component primitives
- **Neon** - Serverless PostgreSQL platform
- **Socket.IO** - Real-time WebSocket library
- **Zod** - TypeScript-first schema validation
- **esbuild** - Fast JavaScript bundler
- **Vitest** - Fast unit test framework
- **pnpm** - Fast, disk-efficient package manager

### Related Documentation

- [README.md](./README.md) - Project overview and setup
- [SECURITY.md](./SECURITY.md) - Security implementation details
- [ENVIRONMENT.md](./ENVIRONMENT.md) - Environment configuration
- [TESTING.md](./TESTING.md) - Testing guidelines
- [apps/web/TESTING.md](./apps/web/TESTING.md) - Playwright E2E testing

### Version History

- **2025-11-15** - Initial CLAUDE.md creation
  - Comprehensive codebase analysis
  - Full architecture documentation
  - Development workflows
  - Security guidelines
  - Testing strategy

---

**This document is maintained for AI assistants (like Claude) to effectively understand and work with The Connection codebase. Keep it updated as the project evolves.**
