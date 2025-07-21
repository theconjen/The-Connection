# The Connection - Christian Community Platform

## Overview
A comprehensive Christian community platform designed to foster digital spiritual engagement across web and mobile platforms, with advanced real-time communication infrastructure.

The application provides a robust, privacy-respecting environment for spiritual growth, featuring direct messaging with real-time communication capabilities and dynamic routing for personalized user interactions. Supports seamless, secure digital community building with modern web technologies.

## Technology Stack
- **Frontend**: React with TypeScript, Vite
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Socket.IO for messaging
- **Authentication**: Express sessions with Passport.js
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Mobile**: React Native with Expo (managed workflow)

## Project Architecture

### Database Schema
- Users table with locality and interest features
- Communities and groups for content organization
- Messages table for direct messaging
- Organizations for church/ministry management
- Posts, comments, and social features
- Livestreams and events

### Recent Changes (Jan 2025)
✓ Fixed database migration issue - created missing messages table for direct messaging
✓ Enhanced mobile UI optimizations with improved touch feedback
✓ Added mobile-specific components:
  - MobileChatInterface for optimized messaging
  - TouchFeedback for haptic responses
  - SwipeHandler for gesture navigation
  - MobileCard for touch-friendly interfaces
✓ Improved responsive layout with keyboard detection
✓ Enhanced mobile navigation with floating action button
✓ Added safe area insets for iOS compatibility

### Mobile Optimizations Implemented
- Touch-friendly navigation with haptic feedback
- Responsive layout that adapts to virtual keyboard
- Mobile-optimized chat interface with smooth scrolling
- Enhanced touch targets (44px minimum)
- Swipe gesture support
- Safe area handling for iOS devices
- Improved typography for mobile readability
- Active state feedback for all interactive elements

## User Preferences
- Focus on mobile-first design approach
- Prioritize user experience and accessibility
- Maintain Christian values and community-focused features
- Ensure cross-platform compatibility

## Development Guidelines
- Follow the fullstack_js development guidelines
- Use TypeScript for type safety
- Implement responsive design patterns
- Test across mobile and desktop platforms
- Maintain clean, documented code
- Prioritize accessibility and performance

## Current Status
The application is running successfully with:
- Database migrations completed
- Real-time messaging functional
- Mobile optimizations implemented
- User authentication working
- Community features operational

## Next Steps
- Continue refining mobile user experience
- Add more interactive features
- Enhance real-time features
- Implement push notifications
- Add offline support for mobile