# Q&A System Architecture - Dual System Design

## Overview

The Connection has **TWO separate but complementary Q&A systems**:

1. **Public Q&A Forum** - Community knowledge base (Stack Overflow style)
2. **Private Inbox System** - Sensitive questions with ticketing workflow

---

## System Comparison

| Feature | Public Q&A | Private Inbox |
|---------|-----------|---------------|
| **Visibility** | Public (everyone sees) | Private (asker + assigned only) |
| **Use Case** | Community knowledge sharing | Sensitive theological questions |
| **Organization** | Topics (broad categories) | Areas + Tags (granular taxonomy) |
| **Response** | Direct answers (voting) | Threaded messages (conversation) |
| **Assignment** | None (anyone can answer) | Auto-routing + accept/decline workflow |
| **Tables** | `apologetics_*` | `user_questions`, `question_assignments`, `question_messages` |

---

## Shared Identity Layer (Single Source of Truth)

### Canonical "Verified Scholar" Flag
- **`users.isVerifiedApologeticsAnswerer`** = THE source of truth
- Used by BOTH systems to display blue verification badge

### Expert Profile Display
- **`apologist_profiles`** = Display info (title, credentials, bio) for both systems
  - `verificationStatus`: 'none' | 'internal' | 'pending' (NOT 'verified')
  - `inboxEnabled`: Controls whether inbox is active for this user
  - **NEVER set `verificationStatus = 'verified'`** - always check `users.isVerifiedApologeticsAnswerer`

### Routing/Expertise (Private Inbox Only)
- **`apologist_expertise`** = Maps experts to areas/tags for auto-routing
  - Only used when `APOLOGIST_ROUTING_ENABLED=true`
  - Currently: all questions → Connection Research Team

---

## Permissions Architecture

### Two Separate Permission Systems (By Design)

#### 1. UI/Access Control (`user_permissions`)
**Purpose:** Controls what tabs/features users can see

- `inbox_access` → Shows "Inbox" tab in drawer, allows viewing assigned questions
- `manage_experts` → Admin tools for granting permissions

**Who has it:**
- Connection Research Team members
- Verified scholars (when inbox_enabled)
- Assistants/editors (even if not verified scholars)

**API:** `GET /me` returns `permissions: ['inbox_access', 'manage_experts']`

#### 2. Public Q&A Answer Rights (`apologetics_answerer_permissions`)
**Purpose:** Controls who can answer which topics in PUBLIC forum

**Who has it:**
- Verified scholars assigned to specific topics
- Topic moderators

**API:** Used by existing public Q&A endpoints

**WHY SEPARATE:** You may grant inbox access to assistants who shouldn't answer public questions, and vice versa.

---

## Routing Logic (Private Inbox)

### Current Implementation (Phase 1)
```javascript
// ALL questions route to Connection Research Team
const researchTeamUserId = parseInt(process.env.RESEARCH_TEAM_USER_ID || '1', 10);
```

### Future Implementation (Phase 2)
```javascript
if (process.env.APOLOGIST_ROUTING_ENABLED === 'true') {
  // Match question area/tag to apologist_expertise
  // Find scholars with primary/secondary expertise
  // Assign based on workload + expertise level
} else {
  // Fallback to research team
}
```

---

## API Endpoints

### Public Q&A (Existing - No Changes)
```
GET  /api/apologetics/topics
GET  /api/apologetics/questions
POST /api/apologetics/questions
POST /api/apologetics/answers
POST /api/apologetics/answers/:id/upvote
GET  /api/apologetics/questions/:id
```

### Private Inbox (New)
```
# User endpoints
POST /api/questions                    # Submit new question (requires domain+area+tag)
GET  /api/questions/mine              # Get my submitted questions

# Responder endpoints (requires inbox_access)
GET  /api/questions/inbox             # Get assigned questions (?status=assigned|accepted|declined|answered)
POST /api/assignments/:id/accept      # Accept assignment
POST /api/assignments/:id/decline     # Decline assignment (auto-reassigns)

# Thread endpoints (asker OR assigned only)
GET  /api/questions/:id/messages      # Get conversation thread
POST /api/questions/:id/messages      # Send message in thread

# Admin endpoints (requires manage_experts)
POST /api/admin/permissions/grant     # Grant inbox_access or manage_experts
POST /api/admin/permissions/revoke    # Revoke permission
GET  /api/admin/responders            # List all users with inbox_access
```

### Identity/Profile
```
GET  /me                              # Returns { userId, role, permissions[], isVerifiedApologeticsAnswerer }
```

---

## Badge Display Logic (Unified Across Both Systems)

### Author Card Rendering
```javascript
// Display name
const displayName = apologistProfile?.title
  ? `${apologistProfile.title} ${user.displayName}`
  : user.displayName;

// Credentials
const credentials = apologistProfile?.credentialsShort || null;

// Badge logic
let badge = null;
if (user.isVerifiedApologeticsAnswerer) {
  badge = { type: 'verified', label: 'Verified Scholar', color: 'blue' };
} else if (userPermissions.includes('inbox_access')) {
  badge = { type: 'internal', label: 'Connection Research Team', color: 'gray' };
}
```

This keeps UI consistent across public Q&A and private inbox without database duplication.

---

## Database Schema Summary

### Public Q&A Tables (Existing)
```sql
apologetics_topics                     -- Topics (broad categories)
apologetics_questions                  -- Public questions
apologetics_answers                    -- Public answers
apologetics_answerer_permissions       -- Topic-level answer permissions
apologist_scholar_applications         -- Application workflow
```

### Private Inbox Tables (New)
```sql
user_permissions                       -- Generic permission system (inbox_access, manage_experts)
qa_areas                               -- Areas (Evidence, Theology, History, Objections, Perspectives)
qa_tags                                -- Tags within areas (Manuscripts, Trinity, etc.)
user_questions                         -- PRIVATE question submissions
question_assignments                   -- Routing and assignment tracking
question_messages                      -- Threaded conversations
```

### Shared Identity Tables (New)
```sql
apologist_profiles                     -- Expert display profiles (used by BOTH systems)
apologist_expertise                    -- Area/tag expertise for routing (private inbox only)
```

---

## Environment Variables

```bash
# Required
RESEARCH_TEAM_USER_ID=19              # Janelle's user ID (default routing target)

# Optional (future)
APOLOGIST_ROUTING_ENABLED=false       # Enable expertise-based routing
```

---

## Seed Data

### Areas (5 per domain)
**Apologetics:** Evidence, Theology, History, Objections, Perspectives
**Polemics:** Evidence, Theology, History, Objections, Perspectives

### Tags (~60 total)
**Example (Apologetics > Evidence):**
- Manuscripts
- Archaeology
- Resurrection
- Old Testament Prophecy
- Fulfilled Prophecy
- Eyewitness Testimony

**All expert profiles/assignments:**
- Created as "Connection Research Team" (no fake names)

---

## Next Steps

### Option A: Mobile Implementation
- Ask Question screen (domain/area/tag selectors)
- My Questions screen (user's submitted questions)
- Thread screen (conversation view)
- Inbox screen (assigned questions - conditional on `inbox_access`)
- Drawer navigation (conditional Inbox tab)

### Option B: Web Implementation First
- `/inbox` route with two-panel layout
- Left: Assigned question list
- Right: Thread + reply composer
- Same API, same permissions

**Recommendation:** Web first - scholars will answer on laptops, not phones.

---

## Migration Commands

```bash
# Run migration (creates all tables)
cd /Users/rawaselou/Desktop/The-Connection-main
node server/run-migrations.ts

# Seed taxonomy (creates areas/tags only, no fake profiles)
node server/seed-qa-taxonomy.ts

# Grant yourself inbox access (replace 19 with your user ID)
# Run this in Postgres or create admin endpoint:
# INSERT INTO user_permissions (user_id, permission, granted_by)
# VALUES (19, 'inbox_access', 19);
```

---

## Architecture Decisions Log

### ✅ Decided
1. **Keep both systems** - Public Q&A + Private Inbox serve different purposes
2. **`users.isVerifiedApologeticsAnswerer`** = canonical verification flag
3. **`apologist_profiles.verificationStatus`** = 'none' | 'internal' | 'pending' only
4. **Two permission systems** - `user_permissions` (UI) vs `apologetics_answerer_permissions` (public Q&A)
5. **All routing → Connection Research Team** until APOLOGIST_ROUTING_ENABLED flag
6. **No fake names** - all seeded data uses "Connection Research Team"

### 🔄 Future Enhancements
- Expertise-based routing with workload balancing
- Public Q&A → Private conversion (escalate sensitive questions)
- Shared analytics dashboard (questions answered, response times)
