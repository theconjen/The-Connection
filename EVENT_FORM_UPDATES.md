# Event Form Updates - API & Database Alignment

## Summary
Updated the Create Event form to properly align with the backend API and database schema requirements.

---

## Changes Made

### 1. **Mobile Form** (`/app/events/create.tsx`)

#### Added Features:
- ✅ **Community Selector (Required)** - Modal-based picker showing all user's communities
- ✅ **Date Picker** - Native calendar with min date validation (can't select past dates)
- ✅ **Time Picker** - 12-hour format (AM/PM) with native iOS/Android pickers
- ✅ **Dark Mode Support** - All elements properly themed for light and dark modes

#### Data Format Fix:
- **OLD**: Sent `startTime` as ISO string: `"2025-01-17T18:00:00.000Z"`
- **NEW**: Sends separate fields:
  ```javascript
  {
    eventDate: "2025-01-17",  // YYYY-MM-DD
    startTime: "18:00:00",     // HH:MM:SS
    endTime: "18:00:00",       // HH:MM:SS (defaults to same as start)
    communityId: 123           // Required, not optional
  }
  ```

---

### 2. **API Client** (`/src/lib/apiClient.ts`)

#### Updated `eventsAPI.create()` TypeScript interface:
```typescript
create: (data: {
  title: string;
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  eventDate: string;      // YYYY-MM-DD format
  startTime: string;      // HH:MM:SS format
  endTime: string;        // HH:MM:SS format
  communityId: number;    // Required (was optional)
}) => apiClient.post('/api/events', data)
```

---

### 3. **Database Schema** (`/packages/shared/src/schema.ts`)

#### Made `communityId` required:
```typescript
// BEFORE:
communityId: integer("community_id").references(() => communities.id)

// AFTER:
communityId: integer("community_id").notNull().references(() => communities.id)
```

**Rationale**: API already enforces this requirement (lines 110-113 in `/server/routes/events.ts`), so the schema should match.

---

### 4. **Database Migration** (Created)

**File**: `/migrations/make_events_community_id_required.sql`

```sql
ALTER TABLE events
ALTER COLUMN community_id SET NOT NULL;

COMMENT ON COLUMN events.community_id IS 'Events must belong to a community - this field is required';
```

**Status**: ⚠️ Migration created but not yet run on production database.

**To apply migration**:
```bash
cd /Users/rawaselou/Desktop/The-Connection-main
psql $DATABASE_URL -f migrations/make_events_community_id_required.sql
```

---

## Backend API (Already Correct)

The backend API (`/server/routes/events.ts`) already had proper validation:

### Lines 110-113:
```typescript
if (!communityId) {
  return res.status(400).json({
    error: 'communityId is required - events must belong to a community'
  });
}
```

### Lines 115-119:
```typescript
const community = await storage.getCommunity(communityId);
if (!community) {
  return res.status(404).json({ error: 'Community not found' });
}
```

### Lines 121-132:
```typescript
// Authorization: User must be community moderator or app admin
const isAppAdmin = user?.isAdmin === true;
const isCommunityAdmin = await storage.isCommunityModerator(communityId, userId);

if (!isAppAdmin && !isCommunityAdmin) {
  return res.status(403).json({
    error: 'Only community admins can create events for this community'
  });
}
```

---

## Testing Checklist

### Before Testing:
- [ ] Restart Expo dev server: `npx expo start`
- [ ] Run migration on database (production only, when ready)

### Test Cases:

#### 1. Community Selection
- [ ] Tap "Community" field - modal opens
- [ ] See list of communities with descriptions
- [ ] Select a community - shows checkmark and name
- [ ] Close modal - selected community displays

#### 2. Date Picker
- [ ] Tap "Date" field - native calendar opens
- [ ] Can't select dates in the past
- [ ] Selected date displays: "Fri, Jan 17, 2026"

#### 3. Time Picker
- [ ] Tap "Time" field - native time picker opens
- [ ] Shows 12-hour format (AM/PM)
- [ ] Selected time displays: "6:00 PM"

#### 4. Dark Mode
- [ ] Toggle dark mode
- [ ] All text visible (no black-on-black text)
- [ ] Modal background properly dimmed
- [ ] Selected community has subtle highlight

#### 5. Validation
- [ ] Try to submit without community - error shown
- [ ] Try to submit without title - error shown
- [ ] Try to submit without description - error shown

#### 6. Successful Creation
- [ ] Fill all required fields
- [ ] Submit form
- [ ] Event creates successfully
- [ ] Navigates back to previous screen

---

## Package Dependencies

**Installed**:
- `@react-native-community/datetimepicker` - Native date/time pickers

---

## Data Flow

```
User Input
  ↓
[Date Picker] → selectedDate (Date object)
[Time Picker] → selectedTime (Date object)
  ↓
handleCreate()
  ↓
Format Conversion:
  - eventDate = selectedDate.toISOString().slice(0, 10)  // "2025-01-17"
  - startTime = "HH:MM:00"                                // "18:00:00"
  - endTime = startTime                                   // "18:00:00"
  ↓
API Call: eventsAPI.create({
  title,
  description,
  location,
  eventDate,
  startTime,
  endTime,
  communityId
})
  ↓
Backend: /server/routes/events.ts
  ↓
Validates:
  - All required fields present
  - Community exists
  - User is community moderator/admin
  ↓
Storage: storage.createEvent()
  ↓
Database: INSERT INTO events (
  event_date,     -- date type
  start_time,     -- time type
  end_time,       -- time type
  community_id    -- integer NOT NULL
)
```

---

## Known Issues / Future Enhancements

### Current Limitations:
1. **End Time**: Currently defaults to same as start time (users can't set different end time)
2. **Recurring Events**: Not supported
3. **Timezone**: Uses device timezone, no explicit timezone selection

### Potential Enhancements:
- [ ] Add optional "End Time" picker
- [ ] Add "All Day Event" toggle
- [ ] Add event image upload
- [ ] Add location autocomplete with map
- [ ] Support virtual event toggle with meeting URL

---

## Files Modified

1. ✅ `/app/events/create.tsx` - Complete redesign with native pickers
2. ✅ `/src/lib/apiClient.ts` - Updated TypeScript interfaces
3. ✅ `/packages/shared/src/schema.ts` - Made communityId NOT NULL
4. ✅ `/migrations/make_events_community_id_required.sql` - Database migration (not yet applied)

---

## Rollback Plan

If issues occur, revert these commits:
1. Mobile form changes
2. API client type updates
3. Schema changes

**Do NOT run the migration** until mobile changes are tested and working correctly.
