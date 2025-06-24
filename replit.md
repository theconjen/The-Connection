# The Connection - Religious Social Platform

## Overview
The Connection is a comprehensive religious social platform built with TypeScript, designed to foster Christian community through local connections, spiritual growth, and shared interests. The platform features communities, prayer requests, microblogs, events, apologetics resources, and user management with location-based matching.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and component-based development
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Styling**: TailwindCSS with shadcn/ui components for consistent design system
- **UI Components**: Radix UI primitives with custom styling via class-variance-authority

### Backend Architecture
- **Runtime**: Node.js with TypeScript for full-stack type safety
- **Framework**: Express.js with session-based authentication
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Store**: PostgreSQL-backed sessions using connect-pg-simple
- **Email**: AWS SES integration with template support (mock mode enabled for development)

### Authentication Strategy
- Express sessions with PostgreSQL storage for persistence
- Scrypt-based password hashing for security
- Admin user support with role-based access control
- Fallback authentication mechanisms for development testing

## Key Components

### Database Layer
- **ORM**: Drizzle with PostgreSQL driver for type-safe queries
- **Schema**: Comprehensive schema covering users, communities, posts, events, prayer requests, and apologetics content
- **Migrations**: Custom migration system for database schema updates
- **Connection Pooling**: PostgreSQL connection pool for efficient database access

### Core Features
1. **User Management**: Registration, authentication, profiles with location data
2. **Communities**: Interest-based and location-based community creation and management
3. **Content Systems**: Posts, microblogs, comments with engagement tracking
4. **Prayer Requests**: Privacy-controlled prayer sharing and response system
5. **Events**: Community event creation with RSVP functionality
6. **Apologetics Center**: Q&A system with verified answerers
7. **Bible Study Tools**: Reading plans and study resources

### Location-Based Features
- User location data (city, state, coordinates) for local matching
- Community location tagging for regional groups
- Interest-based recommendation engine
- Geographic search capabilities

## Data Flow

### Authentication Flow
1. User submits credentials via `/api/auth/login`
2. Server validates against database using scrypt password verification
3. Session created and stored in PostgreSQL sessions table
4. Client receives user data and maintains session via cookies

### Content Creation Flow
1. Authenticated users submit content through protected routes
2. Content validated using Zod schemas
3. Data stored via Drizzle ORM with proper relationships
4. Real-time updates through query invalidation

### Recommendation Engine
1. User preferences and interaction history tracked
2. Content similarity algorithms generate recommendations
3. Location and interest matching for community suggestions
4. Cached recommendations updated periodically

## External Dependencies

### Production Services
- **AWS SES**: Email delivery service for notifications and communication
- **PostgreSQL**: Primary database (can be Neon, AWS RDS, or self-hosted)
- **Google Analytics**: User behavior tracking and analytics (optional)

### Development Tools
- **Replit**: Development environment with built-in PostgreSQL
- **Vite**: Development server with hot module replacement
- **Drizzle Kit**: Database schema management and migrations

### Key Libraries
- **Authentication**: express-session, passport, bcryptjs
- **Database**: drizzle-orm, pg (PostgreSQL driver)
- **Validation**: zod for runtime type checking
- **UI**: @radix-ui components, tailwindcss
- **Email**: @aws-sdk/client-ses, @sendgrid/mail (alternative)

## Deployment Strategy

### Replit Deployment
- **Target**: Autoscale deployment for production
- **Build Process**: `npm run build` compiles TypeScript and bundles client
- **Runtime**: Node.js 20 with PostgreSQL 16 module
- **Port Configuration**: Internal port 5000 mapped to external port 80

### Environment Configuration
- **Development**: Mock email mode, local PostgreSQL
- **Production**: AWS SES integration, external PostgreSQL
- **Session Management**: Secure cookies with configurable domain settings

### Database Migrations
- Custom migration system runs on startup
- Locality and interests features added via migrations
- Automatic table creation for missing schema elements

## Changelog
- June 24, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.