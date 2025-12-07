# Mobile permissions and review notes

## iOS permission strings
- `NSPhotoLibraryUsageDescription`: "Allow access to choose a profile image."
- `NSPhotoLibraryAddUsageDescription`: Implicitly handled by `expo-image-picker` when writing to library.
- `NSCameraUsageDescription`: "Allow camera use for profile or content images."
- `NSMicrophoneUsageDescription`: "Allow microphone access when recording video for uploads."
- `NSUserNotificationsUsageDescription`: "Enable notifications to stay updated on messages, prayers, and events."
- `NSLocationWhenInUseUsageDescription`: "Allow location access to find nearby communities and events."
- `NSLocationAlwaysAndWhenInUseUsageDescription`: "Allow background location to refresh nearby recommendations and notifications."
- Background modes: `location`, `fetch` (supporting background refresh of recommendations and notifications).

### Reviewer guidance (App Store)
- Push notifications: surfaced via Expo Notifications; used for community updates, prayer responses, and event reminders. No device identifiers beyond Expo push token are collected.
- Location: foreground use powers nearby communities/maps, background allows periodic refresh of recommendations; users can toggle in-app and from settings.
- Camera/Microphone/Photos: used only when a user captures or selects media to upload to posts or profiles; no silent recording.

## Android permissions
- `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`: nearby recommendations and map experiences.
- `POST_NOTIFICATIONS`: Expo notifications for messages, prayers, and event reminders.
- `CAMERA`, `RECORD_AUDIO`: capturing photo/video uploads inside the app.
- `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`: selecting images or video from the device library for uploads.

### Reviewer guidance (Play Store)
- Notifications are optional and requested during onboarding; they keep users informed of new activity.
- Media permissions are requested right before capture/selection and are only used to attach media to posts/profile updates.
- Location access is requested in-context on community/map screens; the app functions in a reduced mode without it.

