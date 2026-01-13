# Mobile App Permissions Guide

## Overview

The Connection mobile app now has full permission handling integrated. Here's how it works:

## 📍 Location Services

### What We Use It For:
- Show events near the user
- Auto-fill city in event filters
- Display distance to events
- Show nearby communities

### How It Works:

1. **First Time**: When user opens Events page, the app automatically requests location permission
2. **Permission Dialog**: Native iOS/Android dialog appears with your custom message:
   - iOS: "The Connection needs your location to show nearby events and communities."
   - Android: Same message configured in `app.json`

3. **If User Denies**:
   - Alert appears with option to go to Settings
   - Location icon becomes tappable to retry
   - User can manually type city name

4. **If User Allows**:
   - Location icon shows loading spinner
   - City auto-fills in the "Filter by city..." field
   - User can tap location icon anytime to refresh location

### User Experience:
```
User opens Events tab → Permission request → User allows → City auto-fills
                                            ↓
                                      User denies → Can tap location icon or type manually
```

## 📸 Camera & Photos

### What We Use It For:
- Profile pictures
- Post images
- Community photos

### How It Works:

**Not Yet Implemented** - Ready for integration when you add image upload features:

```typescript
import * as ImagePicker from 'expo-image-picker';

// Pick from gallery
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
});

// Take photo with camera
const result = await ImagePicker.launchCameraAsync({
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
});
```

Permission dialogs will show:
- **Camera**: "The Connection needs access to your camera to take photos for your profile and posts."
- **Photos**: "The Connection needs access to your photos to upload profile pictures and post images."

## 📅 Calendar Integration

### What We Use It For:
- Add events to device calendar
- Set reminders for events

### How It Works:

**Not Yet Implemented** - Ready when you add "Add to Calendar" feature:

```typescript
import * as Calendar from 'expo-calendar';

// Request permission
const { status } = await Calendar.requestCalendarPermissionsAsync();

// Add event
await Calendar.createEventAsync(calendarId, {
  title: 'Sunday Morning Worship',
  startDate: new Date(2025, 1, 12, 10, 0, 0),
  endDate: new Date(2025, 1, 12, 12, 0, 0),
  location: 'Main Sanctuary',
});
```

## 🔧 Phone Settings Integration

### How Users Control Permissions:

#### iOS:
1. User can go to: **Settings → The Connection**
2. See all permissions (Location, Camera, Photos, Calendar)
3. Toggle each on/off

#### Android:
1. User can go to: **Settings → Apps → The Connection → Permissions**
2. See all permissions with options:
   - Allow all the time
   - Allow only while using the app
   - Ask every time
   - Don't allow

### From Within App:
When permission is denied, our alerts include "Open Settings" button that takes user directly to app settings.

## 🛠️ For Developers

### How Permissions Are Configured:

#### 1. **app.json** - Main Configuration

```json
{
  "plugins": [
    ["expo-location", {
      "locationAlwaysAndWhenInUsePermission": "Custom message here"
    }],
    ["expo-image-picker", {
      "photosPermission": "Custom message here",
      "cameraPermission": "Custom message here"
    }]
  ],
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "iOS message",
      "NSCameraUsageDescription": "iOS message",
      "NSPhotoLibraryUsageDescription": "iOS message"
    }
  },
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "CAMERA",
      "READ_EXTERNAL_STORAGE"
    ]
  }
}
```

#### 2. **Location Service** (`src/services/locationService.ts`)

Handles:
- Permission requests
- Location fetching
- Reverse geocoding (coordinates → city name)
- Distance calculations
- Error handling
- Settings redirect

#### 3. **Component Integration**

```typescript
import { getCurrentLocationWithAddress } from '../services/locationService';

// In component:
const location = await getCurrentLocationWithAddress();
if (location) {
  console.log(location.city); // "San Francisco"
  console.log(location.latitude); // 37.7749
}
```

## 📱 Testing Permissions

### iOS Simulator:
1. **Reset permissions**: Device → Erase All Content and Settings
2. **Simulate location**: Debug → Location → Custom Location
3. **Test denial**: Deny permission, then check Settings redirect works

### Android Emulator:
1. **Reset permissions**: Settings → Apps → The Connection → Storage → Clear Data
2. **Simulate location**: Extended Controls (⋯) → Location
3. **Test different permission modes**: Allow all time, While using, etc.

### Physical Device:
1. **Best for real testing**: Always test on actual devices before release
2. **Location accuracy**: WiFi vs GPS vs Cellular
3. **Battery impact**: Location tracking can drain battery

## 🚀 Ready For Implementation

You now have these packages installed and configured:
- ✅ `expo-location` - Geolocation
- ✅ `expo-image-picker` - Camera & Gallery
- ✅ `expo-media-library` - Photo library access
- ✅ `expo-calendar` - Calendar integration
- ✅ `expo-file-system` - File operations
- ✅ `expo-sharing` - Share to other apps

All permissions are configured in `app.json` and will show proper dialogs to users.

## 🔒 Privacy Best Practices

1. **Request only when needed**: Location permission requested when Events tab opens, not on app launch
2. **Explain why**: Clear messages explain purpose of each permission
3. **Fallback options**: Users can still use app if they deny (can type city manually)
4. **Respect denials**: Don't repeatedly ask if user has denied
5. **Settings access**: Easy path to Settings if user changes mind

## 📝 Next Steps

To add more location features:

1. **"Events Near Me" filter**: Use `calculateDistance()` from locationService
2. **Show distance on event cards**: "2.3km away"
3. **Map view**: Show user's location pin + event pins
4. **Communities Near Me**: Apply same logic to communities

Example:
```typescript
import { calculateDistance, formatDistance } from '../services/locationService';

const distance = calculateDistance(
  userLocation.latitude,
  userLocation.longitude,
  event.latitude,
  event.longitude
);

console.log(formatDistance(distance)); // "2.3km away"
```
