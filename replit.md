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
✓ Removed personalized content algorithm from home page per user request
✓ Re-enabled personalized algorithm for Forms, Feed, and Apologetics pages with "Recommended For You" sections
✓ Added Friends feature to Home page showing prayer requests, posts, and apologetics recommendations
✓ Optimized all recommendation components for native mobile app integration
✓ Created mobile-specific FriendsActivity and RecommendedContent components for React Native

### Latest Mobile App Optimizations (Jan 2025)
✓ **Enhanced Microblog Feed**: Smart timestamp formatting, pull-to-refresh, optimistic updates
✓ **Performance Optimizations**: FlatList optimizations, lazy loading, memory management
✓ **New Mobile Components**:
  - OptimizedImage: Lazy loading with error handling
  - PullToRefresh: Branded refresh control with haptics
  - MobileTabNavigation: Ultra-compact navigation (16px icons, minimal padding)
  - OptimizedHomeScreen: Dashboard with real-time stats
  - useSocket: Real-time WebSocket integration
✓ **Ultra-Compact Design**: Navigation reduced to py-0.5, 16px icons for cleaner mobile look
✓ **Smart Timestamps**: Mobile-optimized format showing "2h", "Jan 15", or full dates
✓ **Native Features**: Haptic feedback, gesture support, offline handling
✓ **API Enhancements**: Added toggleMicroblogLike, improved error handling

### Faith-Based Personalized Algorithm (Jan 2025)
✓ **Faith-Focused Scoring**: Implements Score(P,U) = w_e×E + w_r×R + w_t×T + w_f×F formula
✓ **Weighted Components**: Engagement (40%), Relationships (30%), Topic Match (20%), Freshness (10%)
✓ **Faith-Based Interactions**: Likes (+1), Comments (+3), Shares (+5), Saves (+2), Prayer requests (+4)
✓ **Spiritual Content Boost**: 30% boost for faith keywords (bible, prayer, worship, jesus, etc.)
✓ **Trust & Safety**: Verified users get up to 50% score boost, positive engagement ratios rewarded
✓ **Fresh Content Priority**: <24h content gets 50% freshness boost, aggressive decay for older posts
✓ **Comprehensive API**: Real-time recommendation endpoints with interaction tracking
✓ **Algorithm Transparency**: Score breakdowns and reasoning displayed to users

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
- Focus on mobile-first design approach with ultra-compact interface
- Prioritize user experience and accessibility (44px touch targets)
- Maintain Christian values and community-focused features
- Ensure cross-platform compatibility
- **Prefer ultra-minimal navigation** (thin bars, small icons)
- **Clear timestamp display** over relative time formats
- **Native mobile performance** with haptic feedback and smooth animations

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
- **Native mobile app completed and optimized** (React Native/Expo)
- **Ultra-compact mobile interface** with enhanced performance
- **Smart timestamp formatting** for improved clarity
- **Real-time features** with Socket.IO integration
- **Personalized content algorithm** with interaction tracking and smart recommendations

## Mobile App Completion (Jan 2025)
✓ Complete React Native/Expo mobile application built
✓ Modern UI with gradients, animations, and haptic feedback
✓ Full feature parity with web app:
  - User authentication (login/register)
  - Real-time messaging with Socket.IO
  - Microblogs/Posts feed with like functionality
  - Communities with join/leave capabilities
  - Prayer requests with prayer tracking
  - Events discovery and participation
  - Direct messaging system
  - Profile management
  - Push notifications support
✓ Mobile-specific optimizations:
  - Touch-friendly navigation with minimum 44px touch targets
  - Keyboard avoidance and safe area handling
  - Pull-to-refresh functionality
  - Image upload and camera integration
  - Haptic feedback for enhanced UX
  - Offline-capable with proper error handling
✓ App Store readiness:
  - Proper app.json configuration with permissions
  - Bundle identifiers and version management
  - EAS build configuration for production
  - Deployment guide with store submission checklist

## App Store Submission Requirements
- Developer accounts (Apple $99/year, Google $25 one-time)
- App store assets (icons, screenshots, descriptions)
- Legal documents (Privacy Policy, Terms of Service)
- Content moderation system
- Production API configuration

## Latest Update: GitHub Integration (Jan 2025)
✓ **Complete mobile app package organized** for GitHub repository hosting
✓ **GitHub-ready project structure** with comprehensive documentation:
  - Complete React Native app with 8 screens in TheConnectionMobile/ folder
  - Professional README with setup and deployment instructions
  - Deployment guides for iOS App Store and Google Play Store
  - Repository update workflows for existing GitHub projects
✓ **User confirmed existing GitHub repository** - provided update workflow to add mobile app without conflicts
✓ **Mobile app integration ready** - all files organized for seamless repository addition

## Next Steps
- Add mobile app to existing GitHub repository using provided workflow
- Test mobile app locally with `cd TheConnectionMobile && npm install && npx expo start`
- Set up developer accounts for app store submission
- Create app store assets using provided guidelines
- Deploy to iOS App Store and Google Play Store using deployment guides