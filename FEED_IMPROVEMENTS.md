# Feed Screen Improvements - Avatar Uniformity & Expand Posts

## Summary
Fixed two major UX issues in the Feed screen:
1. ✅ **Uniform Avatars** - Both microblog and forum posts now use identical 40x40px circular user avatars
2. ✅ **Expandable Posts** - Forum posts now have "Read more" / "Show less" buttons to view full content

---

## Changes Made

### 1. Uniform Avatar Sizes (`/src/screens/PostCard.tsx`)

#### BEFORE:
- **Microblog posts**: 40x40px circular user avatars with photos
- **Forum posts**: 24x24px community icons (🏛️) - **INCONSISTENT**

#### AFTER:
- **Both post types**: 40x40px circular user avatars with photos - **UNIFORM**

**Implementation:**
```typescript
// Replaced small Avatar component (24px) with standard Image (40px)
<Image
  source={{ uri: getAvatarUrl() }}
  style={{
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
  }}
/>

// Helper function to generate avatar URLs
const getAvatarUrl = () => {
  if (post.isAnonymous) {
    return 'https://ui-avatars.com/api/?name=A&background=9CA3AF&color=fff';
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=222D99&color=fff`;
};
```

---

### 2. Expandable Forum Posts (`/src/screens/PostCard.tsx`)

#### BEFORE:
- Forum posts truncated to 2 lines with `numberOfLines={2}`
- No way to read full content without opening the post
- Text cut off with "..." but no expand button

#### AFTER:
- Posts longer than 100 characters show "Read more" button
- Clicking expands to show full content
- Clicking "Show less" collapses back to 2 lines
- Smooth, in-place expansion without navigation

**Implementation:**
```typescript
// State for expansion
const [isExpanded, setIsExpanded] = useState(false);

// Check if content needs expansion
const needsExpansion = post.content.length > 100;

// Conditional rendering
<View style={{ marginBottom: spacing.sm }}>
  <Text
    variant="bodySmall"
    color="textMuted"
    numberOfLines={isExpanded ? undefined : 2}  // Conditional line limit
  >
    {post.content}
  </Text>
  {needsExpansion && (
    <Pressable
      onPress={(e) => {
        e.stopPropagation();  // Don't trigger card onPress
        setIsExpanded(!isExpanded);
      }}
      style={{ marginTop: spacing.xs }}
    >
      <Text variant="caption" style={{ color: colors.accent, fontWeight: '600' }}>
        {isExpanded ? 'Show less' : 'Read more'}
      </Text>
    </Pressable>
  )}
</View>
```

---

## Layout Structure Changes

### PostCard Component - Before vs After:

**BEFORE:**
```
┌─────────────────────────────────────┐
│ [24px Icon] Channel • @user • time  │
│                                     │
│ Post Title                          │
│ Content preview (2 lines max)...   │  ← No way to expand
│ [Discussion Badge]                  │
│ 💬 0  ❤️ 0                         │
└─────────────────────────────────────┘
```

**AFTER:**
```
┌─────────────────────────────────────┐
│ [40px Avatar] Channel • @user • time│  ← Matches microblog style
│                                     │
│     Post Title                      │
│     Content preview (2 lines)...    │
│     Read more                       │  ← NEW: Expand button
│     [Discussion Badge]              │
│     💬 0  ❤️ 0                     │
└─────────────────────────────────────┘
```

---

## User Flow

### Expanding a Post:
1. User sees forum post with truncated content ("..." at end)
2. Sees "Read more" button in accent color below content
3. Taps "Read more"
4. Content expands to show full text
5. Button changes to "Show less"
6. Tapping "Show less" collapses back to 2 lines

### Benefits:
- ✅ Users can preview content at a glance
- ✅ Users can read full content without leaving feed
- ✅ Clean, familiar pattern (Twitter/X style)
- ✅ No page navigation needed for short posts
- ✅ Maintains feed scrolling context

---

## Technical Details

### Files Modified:
1. ✅ `/src/screens/PostCard.tsx` - Complete redesign

### Dependencies:
- No new dependencies required
- Uses existing React useState hook
- Uses existing theme system (colors, spacing, radii)

### Imports Added:
```typescript
import { Image } from 'react-native';  // For uniform avatars
```

### State Added:
```typescript
const [isExpanded, setIsExpanded] = useState(false);  // Per-card state
```

---

## Testing Checklist

### Avatar Uniformity:
- [x] Microblog posts show 40x40px avatars
- [x] Forum posts show 40x40px avatars
- [x] Anonymous posts show gray "A" avatar
- [x] Regular posts show user initials avatar
- [x] Avatars are circular (borderRadius: 20)
- [x] Avatars have fallback background color
- [x] Tapping avatar navigates to user profile (non-anonymous)

### Expand/Collapse:
- [x] Short posts (<100 chars) don't show "Read more" button
- [x] Long posts (>100 chars) show "Read more" button
- [x] Tapping "Read more" expands full content
- [x] Tapping "Show less" collapses to 2 lines
- [x] Expansion doesn't trigger card onPress
- [x] Button styled in accent color (blue)
- [x] State resets when scrolling away and back

### Dark Mode:
- [x] Avatars visible in dark mode
- [x] "Read more" button readable in dark mode
- [x] Expanded content readable in dark mode
- [x] All colors use theme tokens

---

## Before & After Comparison

### Microblog Post (Unchanged):
```
[40px Avatar] samertawfik @samertawfik · 1 day ago   [...]
              Proverbs 30:4
              💬 0  🔁 1  ❤️ 2  ↗  🔖
```

### Forum Post (Before):
```
[24px 🏛️] General · @Unknown User · 2 days ago      [🔖] [...]
           Sunday Service Discussion
           Our pastor preached on forgiveness today. It really convicted
           me about holding grudges. Anyone else struggle with forgiv...
           [Discussion]
           💬 0  ❤️ 0
```

### Forum Post (After):
```
[40px Avatar] General · @Unknown User · 2 days ago  [🔖] [...]
              Sunday Service Discussion
              Our pastor preached on forgiveness today. It really convicted
              me about holding grudges. Anyone else struggle with forgiv...
              Read more                                    ← NEW
              [Discussion]
              💬 0  ❤️ 0
```

### Forum Post (Expanded):
```
[40px Avatar] General · @Unknown User · 2 days ago  [🔖] [...]
              Sunday Service Discussion
              Our pastor preached on forgiveness today. It really convicted
              me about holding grudges. Anyone else struggle with forgiving
              people who have hurt them repeatedly? I know we're called to
              forgive 70 times 7, but it's so hard in practice.
              Show less                                    ← CHANGED
              [Discussion]
              💬 0  ❤️ 0
```

---

## Performance Notes

- Expansion is instant (no API calls)
- State is per-card (independent expansion)
- Doesn't affect scroll performance
- No unnecessary re-renders

---

## Future Enhancements

Potential improvements:
- [ ] Add animation to expand/collapse transition
- [ ] Show character count on expanded posts
- [ ] Remember expanded state when scrolling away
- [ ] Add "Copy text" button on expanded posts
- [ ] Support markdown formatting in expanded view

---

## Summary

✅ **Fixed avatar inconsistency** - Both post types now use identical 40x40px user avatars
✅ **Added expand functionality** - Forum posts can be read in-place without navigation
✅ **Improved UX** - Consistent feed layout matching Twitter/X patterns
✅ **Zero breaking changes** - Fully backwards compatible with existing code

The feed now provides a uniform, professional appearance with better content accessibility!
