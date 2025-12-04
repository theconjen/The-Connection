# The Connection - Development Changelog

## Latest Updates

### May 14, 2025
- Fixed the double header issue by removing duplicate header from MainLayout
- Updated logo to use new TC Logo-2.png image 
- Fixed authentication form fields to handle null or undefined values
- Restructured layout components for cleaner code organization
- Improved import paths for better component management

### Nov 20, 2025 — Router DI refactor (testing/migration note)
- Refactored the feed routes into a dependency-injected factory: `createFeedRouter(storage)`.
	- Production: the server mounts the feed router with the canonical storage instance (DB-backed) as before.
	- Tests: the lightweight `server/test-app.ts` now exports a `testMemStorage` (in-memory) instance and mounts the router using it. Tests should populate `testMemStorage.data.posts` and other in-memory stores directly to provide deterministic fixtures for API tests.
	- Rationale: avoids test-only globals, makes the route explicitly testable, and prevents brittle cross-worker/module-instance issues when running Vitest in parallel.
	- Action for contributors: when adding new routes that need deterministic testing, prefer the factory pattern and accept a storage-like interface so tests can inject simple in-memory doubles.

## Previous Updates

### Infrastructure & Database
- Established basic project structure with authentication, user management, and PostgreSQL database integration
- Implemented database schema with Drizzle ORM
- Set up AWS SES email system with template management

### Frontend Features
- Implemented complete Twitter-like microblogging with post creation, replies, likes, and sharing
- Enhanced Apologetics center with dynamic question display and loading states
- Added Bible reading plan functionality including database methods, tables, and seed scripts
- Developed comprehensive mobile optimization with responsive layout system and device-adaptive rendering
- Redesigned navigation system with an expanded search bar and navigation positioned to the right
- Enhanced profile page with cover image, modern tab navigation, social stats, and interest tags

### Authentication & User Experience
- Fixed authentication issues to improve sign-in reliability and user experience
- Updated platform branding with a new logo
- Resolved UI rendering issues (double header)
- Added proper accessibility attributes to Sheet components to fix ARIA warnings

### Technical Improvements
- Implemented global error handling for unhandled promise rejections and DOM exceptions
- Created responsive layout component that conditionally renders different UI for mobile/desktop
- Enhanced media query hook for device-adaptive rendering
- Mobile-specific UI includes touch-friendly gestures and context-aware navigation
- Mobile navigation optimized with 5 essential items and "More" menu for less frequent features

### Content Management
- Added creator tier program (Bronze/Silver/Gold) for livestreamers
- Implemented content recommendation engine with user preference tracking

## 2025-12-04 — Email verification & TS cleanup
- Added secure email verification (hashed token, expiry, resend cooldown) and verification endpoints.
- Applied DB migration to add verification columns and updated Drizzle schema.
- Fixed TypeScript errors across client and server; removed temporary `react-native` stub and added `express` `Request.user` typing.
- Ran API tests — all passing.