# The Connection Mobile - Beta Release Notes
**Version:** Beta v0.5.0
**Date:** January 17, 2025
**Build:** Latest

---

## What's New in This Update

### 🎨 Major UI Improvements

#### 1. Modern Create Menu (Instagram-Style Bottom Sheet)
- **Replaced** the old radial fan menu with a sleek, modern bottom sheet
- **Four clear options** with icons and descriptions:
  - Write a Post - Share a thought, verse, or reflection
  - Start a Discussion - Ask a question or invite conversation
  - Create a Community - Build a space around a topic
  - Create an Event - Post a meetup, study, or service
- **Smooth animations** with haptic feedback
- **Swipe to dismiss** or tap backdrop to close
- **Works perfectly** in both light and dark modes

#### 2. Apologetics Screen Complete Redesign
- **New centered header** matching Feed screen style (logo + profile + messages)
- **Search bar** for finding questions, topics, or passages
- **Domain toggle** between Apologetics and Polemics
- **Area filtering** chips for browsing by topic
- **Q&A cards** with Wikipedia-style formatting
- **Warm cream backgrounds** matching other screens
- **SafeArea handling** - no more search bar cutting into status bar
- **"Ask Question" CTA** at bottom for easy access

#### 3. Feed Screen Enhancements
- **Uniform 40x40 avatars** across all post types (Feed posts, Forum posts, Comments)
- **Consistent display names** - shows displayName OR username (not both)
- **Anonymous handling** - posts marked "Anonymous" can't navigate to profile
- **Expand/collapse** for long posts with "Read more" / "Show less"
- **Warm cream card backgrounds** (#F7F5F1 light, #101623 dark)
- **Improved visual consistency** across the entire feed

#### 4. Forum Post Cards Updated
- **Bookmark moved** to bottom right action area
- **Display name sizing** now matches Feed posts (15px, bold)
- **Removed channel names** (e.g., "General") for cleaner look
- **Anonymous safeguards** - can't click through to view profile
- **Better spacing** and touch targets

### 🔧 Backend Improvements

#### Apologetics API Implementation
- **Feed endpoint** (`/api/apologetics/feed`) now returns real Q&A data
  - Search filtering by question text
  - Area filtering by topic
  - Returns best answers (verified first, then by upvotes)
- **Question detail endpoint** (`/api/apologetics/questions/:id`) implemented
- **Taxonomy endpoints** working (`/api/qa/areas`, `/api/qa/areas/:id/tags`)
- **Database migrations** applied for Q&A inbox system

### 🐛 Bug Fixes

- Fixed SafeAreaView on Apologetics screen (search bar was overlapping status bar)
- Fixed "Unknown User" displaying instead of "Anonymous" for anonymous posts
- Fixed avatar size inconsistencies between Feed and Forum posts
- Fixed expand functionality not working on Feed posts
- Fixed JSX syntax error in PostCard component

### 📱 Technical Improvements

- Installed `@gorhom/bottom-sheet` for modern sheet UI
- Added `expo-haptics` for tactile feedback
- Wrapped app with `GestureHandlerRootView` for better gesture support
- Created placeholder routes for all create flows (`/create/*`)
- Updated theme tokens usage across components

---

## Testing Focus Areas

### Please Test These Features

1. **Create Menu**
   - Tap the + button in the bottom tab bar
   - Verify the bottom sheet appears smoothly
   - Try each create option (Post, Discussion, Community, Event)
   - Test swipe-to-dismiss and backdrop tap-to-close
   - Switch between light and dark modes

2. **Apologetics Screen**
   - Search for questions
   - Toggle between Apologetics and Polemics
   - Filter by different Areas
   - Tap on Q&A cards
   - Test the "Ask Question" button

3. **Feed Screen**
   - Check that all avatars are consistent size (40x40)
   - Verify anonymous posts show "Anonymous" correctly
   - Test expand/collapse on long posts
   - Check that card backgrounds are warm cream color
   - Try liking, commenting, bookmarking posts

4. **Visual Consistency**
   - Check that colors match across Feed, Communities, Events, Apologetics
   - Verify warm cream backgrounds everywhere
   - Test light/dark mode switching

### Known Issues

- Create routes are **placeholders only** (will show "UI coming soon")
- Apologetics Q&A data depends on backend having seeded questions
- Tags are hidden until taxonomy is refined (only Areas visible)

---

## What's Coming Next

- Full create flows (Post, Discussion, Community, Event forms)
- Enhanced Apologetics with sources and references
- Trending hashtags and keywords system
- Enhanced feed algorithm (Christian values scoring)
- Additional filter options

---

## Feedback Needed

Please report:
- Any UI inconsistencies or visual bugs
- Performance issues or lag
- Crashes or errors
- Confusing UX or unclear flows
- Dark mode color issues
- Touch target problems (buttons too small/large)

**How to Report:**
- Screenshots are super helpful!
- Include what device you're using (iPhone/Android model)
- Note if you're in light or dark mode
- Describe steps to reproduce

---

## Technical Notes for Developers

### New Dependencies
- `@gorhom/bottom-sheet@^5`
- `expo-haptics` (SDK 54 compatible)

### New Components
- `/src/components/CreateHubSheet.tsx` - Bottom sheet create menu
- `/src/screens/ApologeticsScreen.tsx` - Complete redesign
- `/app/create/*` - Placeholder create routes

### Modified Components
- AppHeader - Added to Apologetics screen
- PostCard - Updated styling and behavior
- FeedScreen - Improved consistency
- CommunitiesScreen - Updated backgrounds
- Tab Layout - Replaced fan menu with bottom sheet

### Database
- Applied QA inbox system migrations
- Created placeholder routes for create flows

---

## Installation Notes

If pulling this update:
1. Run `npm install` to get new dependencies
2. Clear cache: `npx expo start --clear`
3. Restart the app completely

---

Thank you for beta testing! Your feedback helps make The Connection better for everyone.

**- The Connection Team**
