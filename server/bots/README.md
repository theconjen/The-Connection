# The Connection - Content Bots

Automated bots that post Christian content to the public feed.

## Bots

### 📖 Bible Verse Bot (`bibleverse_bot`)
- Posts Bible verses every 8 hours
- Uses the Bible API to fetch verses
- Includes 30 popular and impactful verses
- Posts to public feed (microblogs)

### ✝️ Theology Quote Bot (`theology_quote_bot`)
- Posts quotes from Christian theologians every 6 hours
- Features 40+ curated quotes from:
  - Historical figures (Augustine, Luther, Calvin, Aquinas, etc.)
  - Classic authors (C.S. Lewis, G.K. Chesterton, etc.)
  - Modern theologians (John Piper, Timothy Keller, R.C. Sproul, etc.)
- All quotes are from theologically sound sources

## Setup

### 1. Set Bot Password (Required)

Set a secure password for the bot accounts:

```bash
# In your .env file
BOT_PASSWORD=YourSecurePasswordHere123!
```

### 2. Create Bot Users

Run this once to create the bot user accounts in the database:

```bash
cd server
node -r esbuild-register bots/create-bot-users.ts
```

This creates two user accounts:
- Username: `bibleverse_bot`
- Username: `theology_quote_bot`

### 3. Test Individual Bots

Test each bot manually before scheduling:

```bash
# Test Bible Verse Bot
node -r esbuild-register bots/bible-verse-bot.ts

# Test Theology Quote Bot
node -r esbuild-register bots/theology-quote-bot.ts
```

### 4. Start Scheduler (Production)

Run the scheduler to automatically post content:

```bash
# Start scheduler (runs indefinitely)
node -r esbuild-register bots/scheduler.ts
```

**Posting Schedule:**
- Bible verses: Every 8 hours
- Theology quotes: Every 6 hours

## Production Deployment

### Option 1: Add to Render Background Worker

1. In your `render.yaml`, add a background worker:

```yaml
services:
  # ... your existing web service ...

  - type: worker
    name: content-bots
    env: node
    buildCommand: pnpm install && pnpm run build
    startCommand: node -r esbuild-register server/bots/scheduler.ts
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: your-database-name
          property: connectionString
      - key: BOT_PASSWORD
        sync: false  # Set manually in Render dashboard
```

2. Deploy to Render

### Option 2: Use Cron Jobs

Set up cron jobs to run bots at specific intervals:

```bash
# Edit crontab
crontab -e

# Add these lines (adjust paths as needed):

# Bible verse every 8 hours (at 12am, 8am, 4pm)
0 0,8,16 * * * cd /path/to/server && node -r esbuild-register bots/bible-verse-bot.ts

# Theology quote every 6 hours (at 12am, 6am, 12pm, 6pm)
0 0,6,12,18 * * * cd /path/to/server && node -r esbuild-register bots/theology-quote-bot.ts
```

### Option 3: Node Cron (Recommended for Render)

Install node-cron:

```bash
pnpm add node-cron
```

Create a cron service:

```typescript
// server/bots/cron-service.ts
import cron from 'node-cron';
import { postBibleVerse } from './bible-verse-bot';
import { postTheologyQuote } from './theology-quote-bot';

// Bible verse every 8 hours
cron.schedule('0 */8 * * *', async () => {
  console.log('📖 Running Bible Verse Bot...');
  await postBibleVerse();
});

// Theology quote every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('✝️ Running Theology Quote Bot...');
  await postTheologyQuote();
});

console.log('✓ Bot cron jobs scheduled');
```

## Adding More Content

### Adding Bible Verses

Edit `bible-verse-bot.ts` and add to the `VERSE_REFERENCES` array:

```typescript
const VERSE_REFERENCES = [
  'John 3:16',
  'Your New Verse Reference',
  // ...
];
```

### Adding Theology Quotes

Edit `theology-quote-bot.ts` and add to the `QUOTES` array:

```typescript
const QUOTES: Quote[] = [
  {
    text: "Your quote here",
    author: "Author Name",
    title: "Book or Sermon Title (optional)"
  },
  // ...
];
```

## Monitoring

Check bot activity:

```bash
# View recent posts by bots
psql $DATABASE_URL -c "
  SELECT
    u.username,
    m.content,
    m.created_at
  FROM microblogs m
  JOIN users u ON m.user_id = u.id
  WHERE u.username IN ('bibleverse_bot', 'theology_quote_bot')
  ORDER BY m.created_at DESC
  LIMIT 10;
"
```

## Troubleshooting

### Bot users not found
Run the create-bot-users script:
```bash
node -r esbuild-register bots/create-bot-users.ts
```

### Database connection error
Make sure `DATABASE_URL` is set in your environment variables.

### Bible API failing
The bot uses the free bible-api.com. If it's down, you can:
1. Wait for it to come back up
2. Use a different Bible API (modify `fetchBibleVerse()` function)
3. Use a local JSON file with verses

## Future Enhancements

- [ ] Add prayer of the day bot
- [ ] Add church history facts bot
- [ ] Add seasonal content (Advent, Lent, Easter, Christmas)
- [ ] Add user engagement metrics
- [ ] Support multiple Bible translations
- [ ] Add images/graphics to posts
- [ ] Integrate with image generation for quote graphics

## Notes

- Bots post to the public feed (microblogs table)
- All quotes are from theologically sound, orthodox Christian sources
- Bible verses use the Bible API (free tier)
- Adjust posting frequency in `scheduler.ts` as needed
