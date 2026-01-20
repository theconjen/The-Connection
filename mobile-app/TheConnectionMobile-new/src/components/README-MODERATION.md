# User Moderation Components

This folder contains components for user blocking and reporting functionality.

## Components

### 1. UserActionsMenu
A reusable menu component that provides block and report options for any user.

**Usage:**
```tsx
import { UserActionsMenu } from '@/components/UserActionsMenu';

// Basic usage with default trigger (three dots icon)
<UserActionsMenu userId={post.userId} username={post.username} />

// Custom trigger
<UserActionsMenu
  userId={comment.userId}
  username={comment.username}
  trigger={
    <Ionicons name="flag-outline" size={20} color="red" />
  }
/>
```

### 2. ReportUserModal
Modal for reporting users with predefined reasons and optional description.

**Report Reasons:**
- Harassment or bullying
- Spam or misleading
- Inappropriate content
- Hate speech
- Impersonation
- Other

**Features:**
- Prevents duplicate reports (one report per user)
- Auto-suspend after 10 reports
- Admin review system

### 3. BlockUserModal
Modal for blocking users with optional reason.

**Block Reasons:**
- Harassment or bullying
- Spam or unwanted messages
- Inappropriate behavior
- Other

**What blocking does:**
- Hides their posts and comments
- Prevents them from messaging you
- They won't see your posts on the feed
- Can be reversed anytime from Settings

### 4. BlockedUsersScreen
Full screen for managing blocked users.

**Features:**
- View all blocked users
- Unblock users
- Empty state when no blocks
- Pull-to-refresh support

## Integration Examples

### In a Post Card
```tsx
function PostCard({ post }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text>{post.title}</Text>
        <UserActionsMenu userId={post.userId} username={post.username} />
      </View>
      <Text>{post.content}</Text>
    </View>
  );
}
```

### In a User Profile
```tsx
function UserProfile({ user }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text>{user.displayName}</Text>
        <UserActionsMenu
          userId={user.id}
          username={user.username}
          trigger={<Button title="..." />}
        />
      </View>
    </View>
  );
}
```

### In a Comment
```tsx
function Comment({ comment }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <Text flex={1}>{comment.content}</Text>
      <UserActionsMenu
        userId={comment.userId}
        username={comment.username}
      />
    </View>
  );
}
```

## Backend Endpoints

### User Reporting
- `POST /api/user-reports` - Report a user
  - Body: `{ userId, reason, description? }`
  - Auto-suspends user after 10 reports

### User Blocking
- `POST /api/blocks` - Block a user
  - Body: `{ userId, reason? }`
- `DELETE /api/blocks/:userId` - Unblock a user
- `GET /api/blocked-users` - Get all blocked users

### Admin Endpoints
- `GET /api/admin/suspended-users` - View suspended users
- `GET /api/admin/user-reports/:userId` - View reports for a user
- `POST /api/admin/users/:userId/suspend` - Manually suspend
- `POST /api/admin/users/:userId/unsuspend` - Unsuspend a user

## How Auto-Suspend Works

1. User reports another user → Report created
2. System increments `reportCount` on reported user
3. If `reportCount >= 10` → User automatically suspended
4. Suspended users cannot:
   - Log in to the app
   - Access any protected endpoints
   - Post, comment, or interact
5. Admins can review and unsuspend if reports are invalid

## Navigation

Users can access their blocked users list from:
- Settings → Privacy → Blocked Users
- Direct navigation: `router.push('/blocked-users')`

## Styling

All components use the theme system from `src/theme`:
- Colors are dynamic based on light/dark mode
- Spacing follows the app's design tokens
- Consistent with the rest of the app

## Security Notes

- All endpoints require authentication
- Users cannot report/block themselves
- Duplicate reports are prevented
- Suspended users are blocked at the middleware level
- Admin actions are logged in the audit system
