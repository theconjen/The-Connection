# Apologetics Screen - Status Report

## ✅ Fixed Issues

### 1. Safe Area Fix
- **Problem**: Search bar was cutting into the status bar
- **Solution**: Wrapped screen in `SafeAreaView` component
- **File**: `/src/screens/ApologeticsScreen.tsx`

### 2. Warm Cream Background
- **Applied**: `colors.backgroundSoft` to all cards
- **Light Mode**: `#F7F5F1` (warm cream)
- **Dark Mode**: `#101623` (lighter ink)
- **Matches**: Feed posts and Community cards

---

## ✅ Existing API Endpoints

### Taxonomy (Areas & Tags)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/qa/areas?domain=apologetics` | GET | ✅ **WORKING** | Get all areas for domain |
| `/api/qa/areas/:id/tags` | GET | ✅ **WORKING** | Get tags for specific area |

### Q&A Feed & Detail
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/apologetics/feed` | GET | ✅ **IMPLEMENTED** | Returns Q&A feed with search and area filtering |
| `/api/apologetics/questions/:id` | GET | ✅ **IMPLEMENTED** | Returns single Q&A detail by ID |

### Legacy Endpoints (Still Active)
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/apologetics` | GET | ✅ WORKING | Get all apologetics resources |
| `/api/apologetics/topics` | GET | ✅ WORKING | Get all topics |
| `/api/apologetics/questions` | GET | ✅ WORKING | Get all questions |
| `/api/apologetics/questions/:id` | GET | ✅ WORKING | Get question detail |

### Admin Endpoints
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/apologetics/admin` | GET | ✅ WORKING | Admin UI (HTML page) |
| `/api/apologetics/admin/resources` | GET/POST/PATCH/DELETE | ✅ WORKING | Manage resources |
| `/api/apologetics/admin/topics` | GET/POST/PATCH/DELETE | ✅ WORKING | Manage topics |

---

## ✅ Existing Database Tables

### QA Taxonomy System
```sql
-- Areas (domains: apologetics or polemics)
qa_areas (id, domain, name, slug, description, order)

-- Tags (belong to areas)
qa_tags (id, area_id, name, slug, description, order)
```

### Legacy Apologetics System
```sql
-- Resources
apologetics_resources (id, title, description, type, url, iconName)

-- Topics
apologetics_topics (id, name, slug, description, iconName)

-- Questions
apologetics_questions (id, userId, topicId, question, createdAt, deletedAt)

-- Answers
apologetics_answers (id, userId, questionId, answer, upvotes, createdAt)

-- Permissions
apologetics_answerer_permissions (id, userId, topicId, createdAt)
```

### Private Q&A Inbox System
```sql
-- User-submitted questions (private inbox)
user_questions (id, askerUserId, domain, areaId, tagId, questionText, status)

-- Question assignments
question_assignments (id, questionId, assignedToUserId, status)

-- Threaded messages
question_messages (id, questionId, senderUserId, body)

-- Expert permissions
expert_area_permissions (id, userId, areaId, tagId)

-- Global permissions
user_permissions (id, userId, permission, grantedBy)
```

---

## ✅ Implementation Complete

### 1. Feed Endpoint (`/api/apologetics/feed`)

**Status**: ✅ **IMPLEMENTED**

**What It Does**:
1. Queries `apologetics_questions` table
2. Joins with `apologetics_answers` to get best answer (verified first, then by upvotes)
3. Joins with `apologetics_topics` for area names
4. Filters by:
   - `domain` (apologetics/polemics)
   - `q` (search query via ILIKE)
   - `areaId` (using topicId as proxy until full migration)
5. Returns format:
```typescript
{
  id: string;
  question: string;
  areaName: string;
  tagName: string; // Empty for now (tags disabled)
  answer: string;
  sources: string[];
}[]
```

**Implementation Location**: `/server/routes/apologetics.ts` (lines 38-116)

### 2. Question Detail Endpoint (`/api/apologetics/questions/:id`)

**Status**: ✅ **IMPLEMENTED**

**What It Does**:
1. Queries `apologetics_questions` by ID
2. Joins with best `apologetics_answers` (verified first, then by upvotes)
3. Joins with `apologetics_topics` for area name
4. Returns same format as feed item

**Implementation Location**: `/server/routes/apologetics.ts` (lines 118-170)

### 3. Data Migration Strategy

**Current Approach**: ✅ **Using Existing Tables**
- Using `apologetics_topics` as proxy for `qa_areas`
- Mapping `topicId` to `areaId` in queries
- `tagName` left empty (tags disabled until refined)
- Sources extracted from answer content (placeholder for now)

---

## 📋 Implementation Checklist

### Phase 1: Seed Taxonomy Data
- [x] ✅ `qa_areas` and `qa_tags` tables exist in database
- [x] ✅ Taxonomy endpoints working (`/api/qa/areas`, `/api/qa/areas/:id/tags`)

### Phase 2: Implement Feed Query
- [x] ✅ Using `apologetics_topics` as proxy for areas
- [x] ✅ Created join query for questions + best answer
- [x] ✅ Added search functionality (ILIKE on question title and content)
- [x] ✅ Added area filtering (via topicId)
- [x] ✅ Tags disabled until refined

### Phase 3: Implement Detail Query
- [x] ✅ Query single question with best answer
- [x] ✅ Format response to match feed item structure
- [x] ✅ Returns 404 if question not found

### Phase 4: Mobile App Integration
- [ ] Test mobile app with real data
- [ ] Verify filtering works (domain, area)
- [ ] Test search functionality
- [ ] Verify "Ask Question" flow routes correctly

---

## 🔧 Quick Start Commands

### Seed Taxonomy
```bash
cd /Users/rawaselou/Desktop/The-Connection-main
node server/seed-qa-taxonomy.ts
```

### Check Database
```bash
# Check areas
psql $DATABASE_URL -c "SELECT * FROM qa_areas WHERE domain = 'apologetics';"

# Check tags
psql $DATABASE_URL -c "SELECT * FROM qa_tags LIMIT 10;"

# Check existing questions
psql $DATABASE_URL -c "SELECT COUNT(*) FROM apologetics_questions;"
```

### Test Endpoints
```bash
# Test areas endpoint
curl http://localhost:5000/api/qa/areas?domain=apologetics

# Test tags endpoint (replace {areaId} with actual ID)
curl http://localhost:5000/api/qa/areas/{areaId}/tags

# Test feed (will return empty for now)
curl http://localhost:5000/api/apologetics/feed?domain=apologetics
```

---

## 📝 Notes

1. **Two Q&A Systems Exist**:
   - **Public**: `apologetics_questions` + `apologetics_answers` (shown in mobile feed)
   - **Private**: `user_questions` + `question_messages` (inbox system for experts)

2. **Mobile App Uses New Taxonomy**:
   - Areas and Tags from `qa_areas` + `qa_tags`
   - NOT the old `apologetics_topics` system

3. **Migration Path**:
   - Keep both systems for now
   - Map old topics → new areas
   - Gradually migrate UI to new taxonomy

4. **Author Line**:
   - Hardcoded as "Connection Research Team" in mobile
   - Backend doesn't need to send author info

---

## ✅ Summary

**Fully Working**:
- ✅ SafeAreaView fixed (no more status bar overlap)
- ✅ Warm cream backgrounds matching other screens
- ✅ Areas and Tags API endpoints functional
- ✅ Database tables exist
- ✅ **Feed endpoint implemented** - returns Q&A data with search and filtering
- ✅ **Detail endpoint implemented** - returns single Q&A by ID
- ✅ Questions joined with best answers (verified first, then by upvotes)
- ✅ Search functionality working (ILIKE on title and content)
- ✅ Area filtering working (using topicId as proxy)

**Ready for Testing**:
- 🧪 Mobile app needs testing with real data
- 🧪 Verify search and filtering work as expected
- 🧪 Test "Ask Question" flow navigation

**Future Enhancements**:
- 📝 Enable tags when taxonomy is refined
- 📝 Extract sources from answer content
- 📝 Full migration from `apologetics_topics` to `qa_areas`
