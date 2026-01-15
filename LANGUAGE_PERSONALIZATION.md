# Language-Based Content Personalization

## Overview

The Connection now includes **intelligent language detection and personalization** to improve user experience by showing content in languages users engage with most.

This system automatically:
1. **Detects the language** of every post and microblog
2. **Tracks what users engage with** (likes, comments, shares)
3. **Personalizes their feed** to prioritize content in their preferred languages

## How It Works

### 1. Automatic Language Detection

When users create content (posts or microblogs), the system:
- Analyzes the text using the `franc-min` library
- Detects the language (supports 50+ languages including English, Arabic, Spanish, French, etc.)
- Stores the ISO 639-1 language code (e.g., `en`, `ar`, `es`) with the content

**Example:**
- User posts: "مرحبا! كيف حالك؟" → Detected as `ar` (Arabic)
- User posts: "Hello! How are you?" → Detected as `en` (English)
- User posts: "¡Hola! ¿Cómo estás?" → Detected as `es` (Spanish)

### 2. Engagement Tracking

The system tracks every user interaction and learns their language preferences:

**Interaction Types & Weights:**
- View: 0.5 points
- Like: 2 points
- Bookmark: 2 points
- Comment: 3 points
- Share: 4 points
- Follow author: 5 points

**How it works:**
- User likes an Arabic post → Arabic engagement score +2
- User comments on a Spanish post → Spanish engagement score +3
- User shares an English post → English engagement score +4

This data is stored in `user_preferences.language_engagement`:
```json
{
  "en": 45,  // 45 points of engagement with English content
  "ar": 32,  // 32 points with Arabic
  "es": 8    // 8 points with Spanish
}
```

### 3. Preferred Languages Calculation

Based on engagement scores, the system automatically determines a user's top 3 preferred languages:

```javascript
// Example user engagement
{
  "en": 45,
  "ar": 32,
  "es": 8,
  "fr": 3
}

// Calculated preferred languages (in order)
preferredLanguages: ["en", "ar", "es"]
```

**Note:** English is always included as a fallback if not already present.

### 4. Feed Personalization

When a user opens their feed, posts are scored based on:

**Language Match Score (50% weight):**
- 1st preferred language: 100 points
- 2nd preferred language: 80 points
- 3rd preferred language: 60 points
- Other languages: 20 points (allows some diversity)
- Unknown language: 50 points (neutral)

**Recency Score (30% weight):**
- 0-2 hours old: 100 points
- 2-6 hours old: 90 points
- 6-12 hours old: 70 points
- 12-24 hours old: 50 points
- 24-48 hours old: 30 points
- 48+ hours old: 10 points

**Engagement Score (20% weight):**
- Based on upvotes, comments, and likes
- Capped at 100 points

**Final feed score:**
```
score = (languageScore × 0.5) + (recencyScore × 0.3) + (engagementScore × 0.2)
```

### Example Feed Ranking

User's preferred languages: `["en", "ar", "es"]`

| Post | Language | Age | Engagement | Language Score | Recency Score | Engagement Score | **Final Score** |
|------|----------|-----|------------|----------------|---------------|------------------|-----------------|
| A    | en       | 1h  | High       | 100            | 100           | 80               | **94**          |
| B    | ar       | 3h  | Medium     | 80             | 90            | 50               | **76**          |
| C    | en       | 12h | Low        | 100            | 50            | 20               | **69**          |
| D    | fr       | 2h  | High       | 20             | 90            | 80               | **53**          |
| E    | es       | 6h  | Medium     | 60             | 70            | 50               | **61**          |

**Feed order:** A → B → E → C → D

Notice that:
- Post A (English, recent, high engagement) ranks highest
- Post D (French, not in preferences) ranks lowest despite being recent with high engagement
- The system balances language preference with recency and popularity

## Real-World Scenarios

### Scenario 1: Multilingual Community
**Context:** Your platform has English, Arabic, and Spanish users

**Before language personalization:**
- English users see a mix of all languages
- Arabic users frustrated by too much English/Spanish content
- Users may leave due to language barriers

**After language personalization:**
- English users primarily see English content
- Arabic users primarily see Arabic content
- Spanish users primarily see Spanish content
- Each group can still discover other languages (20% score) for diversity

### Scenario 2: New User Onboarding
**Initial state:**
- New user has no engagement history
- Default `preferredLanguages: ["en"]`

**After 1 week:**
- User likes 15 Arabic posts, 5 English posts
- Engagement: `{ "ar": 30, "en": 10 }`
- New preferences: `["ar", "en"]`
- Feed now prioritizes Arabic content

### Scenario 3: Bilingual User
**User behavior:**
- Engages equally with English and Spanish content
- Engagement: `{ "en": 40, "es": 38 }`
- Preferences: `["en", "es"]`
- Feed shows balanced mix of both languages

## Database Schema

### Posts & Microblogs
```sql
ALTER TABLE posts ADD COLUMN detected_language VARCHAR(10);
ALTER TABLE microblogs ADD COLUMN detected_language VARCHAR(10);

CREATE INDEX idx_posts_language ON posts(detected_language);
CREATE INDEX idx_microblogs_language ON microblogs(detected_language);
```

### User Preferences
```sql
ALTER TABLE user_preferences ADD COLUMN preferred_languages JSONB DEFAULT '["en"]'::jsonb;
ALTER TABLE user_preferences ADD COLUMN language_engagement JSONB DEFAULT '{}'::jsonb;
```

## API Integration

### Creating Content
When a user creates a post or microblog:

```typescript
// POST /api/posts
const post = await storage.createPost(validatedData);

// Asynchronously detect and store language
const detectedLanguage = detectLanguage(post.title + ' ' + post.content);
await storage.updatePost(post.id, { detectedLanguage });
```

### Liking Content
When a user likes a post:

```typescript
// POST /api/posts/:id/upvote
const result = await storage.togglePostVote(postId, userId, 'upvote');

// Track engagement for language learning
if (result.voted) {
  await trackEngagement(userId, postId, 'post', 'like');
}
```

### Fetching Feed
When a user requests their feed:

```typescript
// GET /api/feed
const userLanguages = await getUserLanguagePreferences(userId); // ["en", "ar"]
const posts = await storage.getAllPosts();

// Score each post based on language match
const scoredPosts = posts.map(post => ({
  ...post,
  feedScore: calculateFeedScore(post, userLanguages, Date.now())
}));

// Sort by score and return
scoredPosts.sort((a, b) => b.feedScore - a.feedScore);
```

## Supported Languages

The system supports 50+ languages including:

- **Major Western Languages:** English, Spanish, French, German, Italian, Portuguese
- **Middle Eastern:** Arabic, Hebrew, Persian, Turkish
- **Asian:** Chinese, Japanese, Korean, Hindi, Bengali, Thai, Vietnamese
- **European:** Russian, Polish, Dutch, Swedish, Norwegian, Finnish, Danish
- **And many more...**

Full ISO 639-1 code mapping is in `/server/services/languageDetection.ts`

## Privacy & User Control

### Privacy
- Language preferences are inferred from public interactions (likes, comments)
- No explicit language selection required
- All processing happens server-side

### Future Enhancements (Optional)
You could add:
1. **Manual language preferences** in user settings
2. **Language filter toggle** to show/hide specific languages
3. **"Translate" button** for posts in unfamiliar languages
4. **Analytics dashboard** showing language distribution

## Configuration

### Adjusting Weights
In `/server/routes/createFeedRouter.ts`:

```typescript
// Modify these values to change feed behavior
const LANGUAGE_WEIGHT = 0.5;  // 50% - Language importance
const RECENCY_WEIGHT = 0.3;   // 30% - Time decay
const ENGAGEMENT_WEIGHT = 0.2; // 20% - Popularity

// Example: To prioritize recency over language
const LANGUAGE_WEIGHT = 0.3;
const RECENCY_WEIGHT = 0.5;
```

### Changing Interaction Weights
In `/server/services/engagementTracking.ts`:

```typescript
const INTERACTION_WEIGHTS = {
  view: 0.5,
  like: 2,
  comment: 3,
  share: 4,
  bookmark: 2,
  follow_author: 5,
};

// Example: Make likes more important
like: 5,  // Increased from 2
```

## Testing the System

### Manual Testing

1. **Create test users:**
   ```bash
   # User 1: English preference
   # User 2: Arabic preference
   # User 3: Bilingual (English + Spanish)
   ```

2. **Create multilingual content:**
   ```bash
   curl -X POST http://localhost:5000/api/posts \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello World", "title": "English Post"}'

   curl -X POST http://localhost:5000/api/posts \
     -H "Content-Type: application/json" \
     -d '{"text": "مرحبا بالعالم", "title": "منشور عربي"}'
   ```

3. **Like content as different users:**
   ```bash
   # User 1 likes English posts
   # User 2 likes Arabic posts
   # User 3 likes both
   ```

4. **Check feed personalization:**
   ```bash
   GET /api/feed (as User 1) # Should see mostly English
   GET /api/feed (as User 2) # Should see mostly Arabic
   GET /api/feed (as User 3) # Should see balanced mix
   ```

### Monitoring

Check logs for language detection:
```bash
tail -f server.log | grep "\[Language\]"

# Output:
# [Language] Detected en for post 123
# [Language] Detected ar for microblog 456
# [Language] Detected es for post 789
```

Check engagement tracking:
```bash
tail -f server.log | grep "\[Engagement\]"

# Output:
# [Engagement] User 42 like post 123 (en)
# [Engagement] User 42 comment microblog 456 (ar)
```

## Troubleshooting

### Issue: All content detected as English

**Cause:** Text too short for accurate detection
**Solution:** Franc requires minimum 10 characters. Very short posts default to English.

```typescript
// In languageDetection.ts
if (!text || text.trim().length < 10) {
  return 'en'; // Default for short text
}
```

### Issue: User preferences not updating

**Cause:** User preferences record doesn't exist
**Solution:** System auto-creates preferences on first interaction

```typescript
// In engagementTracking.ts
if (!preferences) {
  await storage.createUserPreferences({
    userId,
    preferredLanguages: ['en'],
    languageEngagement: {},
  });
}
```

### Issue: Feed not personalized

**Cause:** Migration not run
**Solution:** Run the migration

```bash
cd /Users/rawaselou/Desktop/The-Connection-main
node server/run-migrations.ts
```

## Performance Considerations

### Database Indexes
Ensure these indexes exist:
```sql
CREATE INDEX idx_posts_language ON posts(detected_language);
CREATE INDEX idx_microblogs_language ON microblogs(detected_language);
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
```

### Async Processing
Language detection and engagement tracking run asynchronously to avoid blocking API responses:

```typescript
// Don't wait for these operations
Promise.resolve().then(async () => {
  const language = detectLanguage(content);
  await storage.updatePost(id, { detectedLanguage: language });
});
```

### Caching (Future Enhancement)
Consider caching user language preferences:
```typescript
// Example with Redis
const cachedPreferences = await redis.get(`user_lang:${userId}`);
if (cachedPreferences) return JSON.parse(cachedPreferences);
```

## Migration Guide

### Step 1: Run Migration
```bash
cd /Users/rawaselou/Desktop/The-Connection-main
node server/run-migrations.ts
```

### Step 2: Install Dependencies
```bash
npm install franc-min
```

### Step 3: Deploy Changes
```bash
# Commit and push
git add .
git commit -m "Add language-based content personalization"
git push

# Deploy to production
./deploy-production.sh
```

### Step 4: Verify
```bash
# Check a few posts to confirm language detection
curl http://yourdomain.com/api/feed

# Response should include detectedLanguage
{
  "items": [
    {
      "id": 123,
      "content": "Hello World",
      "detectedLanguage": "en",
      ...
    }
  ]
}
```

## Future Enhancements

### 1. User Language Settings
Allow users to manually set preferred languages:

```typescript
// Add to user settings page
PUT /api/user/language-preferences
{
  "preferredLanguages": ["en", "ar", "es"]
}
```

### 2. Translation Integration
Integrate with Google Translate or DeepL:

```typescript
// Add translate button
POST /api/posts/:id/translate
{
  "targetLanguage": "en"
}
```

### 3. Language-Specific Communities
Create communities for specific languages:

```typescript
// Community metadata
{
  "id": 42,
  "name": "Arabic Christian Fellowship",
  "primaryLanguage": "ar",
  "allowedLanguages": ["ar", "en"]
}
```

### 4. Analytics Dashboard
Show language distribution:
- Posts by language
- User distribution by preferred language
- Engagement rates per language

---

## Summary

The language personalization system:

✅ **Automatically detects** 50+ languages
✅ **Learns user preferences** from their interactions
✅ **Personalizes feeds** to show relevant content
✅ **Maintains diversity** by allowing discovery
✅ **Works passively** - no user configuration needed
✅ **Scales efficiently** with async processing

This creates a better experience for multilingual communities like yours with English, Arabic, and Spanish users!
