import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { isAdmin, isAuthenticated } from '../auth';
import { storage } from '../storage-optimized';
import { buildErrorResponse } from '../utils/errors';
import { insertApologeticsTopicSchema, insertApologeticsBookmarkSchema } from '@shared/schema';

// Set up rate limiter for /apologetics: max 100 requests per 15 minutes per IP
const apologeticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit headers
});

const router = Router();

function ensureStorageMethod<T extends keyof typeof storage>(method: T) {
  const impl = storage[method];
  if (typeof impl !== 'function') {
    throw new Error(`Storage method ${String(method)} is not implemented`);
  }
  return impl.bind(storage) as typeof storage[T];
}

router.get('/apologetics', apologeticsLimiter, async (_req, res) => {
  try {
    const getAllApologeticsResources = ensureStorageMethod('getAllApologeticsResources');
    const resources = await getAllApologeticsResources();
    return res.json(resources);
  } catch (err) {
    console.error('Error serving apologetics:', err);
    return res.status(500).json(buildErrorResponse('Error loading apologetics resources', err));
  }
});

// GET /qa-areas - Get all QA areas for a domain
router.get('/qa-areas', apologeticsLimiter, async (req, res) => {
  try {
    const { domain = 'apologetics' } = req.query;

    // Validate domain
    if (domain !== 'apologetics' && domain !== 'polemics') {
      return res.status(400).json({ message: 'Invalid domain. Must be "apologetics" or "polemics"' });
    }

    const { db } = await import('../db');
    const { qaAreas } = await import('@shared/schema');
    const { eq, asc } = await import('drizzle-orm');

    const areas = await db
      .select({
        id: qaAreas.id,
        name: qaAreas.name,
        domain: qaAreas.domain,
      })
      .from(qaAreas)
      .where(eq(qaAreas.domain, domain as string))
      .orderBy(asc(qaAreas.name));

    return res.json(areas);
  } catch (err) {
    console.error('Error serving qa-areas:', err);
    return res.status(500).json(buildErrorResponse('Error loading QA areas', err));
  }
});

// GET /qa-tags - Get all QA tags for an area
router.get('/qa-tags', apologeticsLimiter, async (req, res) => {
  try {
    const { areaId } = req.query;

    if (!areaId || isNaN(Number(areaId))) {
      return res.status(400).json({ message: 'areaId query parameter is required and must be a number' });
    }

    const { db } = await import('../db');
    const { qaTags } = await import('@shared/schema');
    const { eq, asc } = await import('drizzle-orm');

    const tags = await db
      .select({
        id: qaTags.id,
        name: qaTags.name,
        slug: qaTags.slug,
        areaId: qaTags.areaId,
      })
      .from(qaTags)
      .where(eq(qaTags.areaId, Number(areaId)))
      .orderBy(asc(qaTags.order));

    return res.json(tags);
  } catch (err) {
    console.error('Error serving qa-tags:', err);
    return res.status(500).json(buildErrorResponse('Error loading QA tags', err));
  }
});

// GET /apologetics/feed - Get Q&A feed with filtering
router.get('/apologetics/feed', apologeticsLimiter, async (req, res) => {
  try {
    const { domain = 'apologetics', q, areaId } = req.query;

    // Validate domain
    if (domain !== 'apologetics' && domain !== 'polemics') {
      return res.status(400).json({ message: 'Invalid domain. Must be "apologetics" or "polemics"' });
    }

    const { db } = await import('../db');
    const { userQuestions, questionMessages, qaAreas, qaTags } = await import('@shared/schema');
    const { eq, like, and, desc, sql, inArray } = await import('drizzle-orm');

    // Build query conditions
    const conditions: any[] = [];
    conditions.push(eq(userQuestions.domain, domain));

    // Search filter
    if (q && typeof q === 'string' && q.trim()) {
      conditions.push(
        sql`${userQuestions.questionText} ILIKE ${`%${q.trim()}%`}`
      );
    }

    // Area filter
    if (areaId && typeof areaId === 'string') {
      const parsedAreaId = parseInt(areaId, 10);
      if (Number.isFinite(parsedAreaId)) {
        conditions.push(eq(userQuestions.areaId, parsedAreaId));
      }
    }

    // Get all answered questions
    const questions = await db
      .select({
        questionId: userQuestions.id,
        questionText: userQuestions.questionText,
        areaId: userQuestions.areaId,
        tagId: userQuestions.tagId,
        askerUserId: userQuestions.askerUserId,
      })
      .from(userQuestions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(50);

    if (questions.length === 0) {
      return res.json([]);
    }

    // Get area and tag names
    const areaIds = [...new Set(questions.map(q => q.areaId))];
    const tagIds = [...new Set(questions.map(q => q.tagId))];

    const areas = await db
      .select()
      .from(qaAreas)
      .where(inArray(qaAreas.id, areaIds));

    const tags = await db
      .select()
      .from(qaTags)
      .where(inArray(qaTags.id, tagIds));

    const areaMap = new Map(areas.map(a => [a.id, a.name]));
    const tagMap = new Map(tags.map(t => [t.id, t.name]));

    // Get all messages for these questions
    const questionIds = questions.map(q => q.questionId);
    const allMessages = await db
      .select()
      .from(questionMessages)
      .where(inArray(questionMessages.questionId, questionIds))
      .orderBy(desc(questionMessages.createdAt));

    // Build map of question ID to asker user ID
    const askerMap = new Map(
      questions.map(q => [q.questionId, q.askerUserId])
    );

    // Group answers by question (find first non-asker message as the answer)
    const answerMap = new Map<number, string>();
    for (const msg of allMessages) {
      if (!answerMap.has(msg.questionId)) {
        const askerUserId = askerMap.get(msg.questionId);
        const questionMsgs = allMessages.filter(m => m.questionId === msg.questionId);
        const answerMsg = questionMsgs.find(m => m.senderUserId !== askerUserId);
        if (answerMsg) {
          answerMap.set(msg.questionId, answerMsg.body || '');
        }
      }
    }

    // Build feed
    const feed = questions.map(q => ({
      id: q.questionId.toString(),
      question: q.questionText || '',
      areaName: areaMap.get(q.areaId) || '',
      tagName: tagMap.get(q.tagId) || '',
      answer: answerMap.get(q.questionId) || '',
      sources: [], // TODO: Extract sources from answer content if needed
    }));

    return res.json(feed);
  } catch (err) {
    console.error('Error serving apologetics feed:', err);
    return res.status(500).json(buildErrorResponse('Error loading feed', err));
  }
});

// GET /apologetics/questions/:id - Get single Q&A detail
router.get('/apologetics/questions/:id', apologeticsLimiter, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    const { db } = await import('../db');
    const { userQuestions, questionMessages, qaAreas, qaTags } = await import('@shared/schema');
    const { eq, desc } = await import('drizzle-orm');

    // Query the question
    const [question] = await db
      .select()
      .from(userQuestions)
      .where(eq(userQuestions.id, id))
      .limit(1);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Get area and tag info
    const [area] = await db
      .select()
      .from(qaAreas)
      .where(eq(qaAreas.id, question.areaId))
      .limit(1);

    const [tag] = await db
      .select()
      .from(qaTags)
      .where(eq(qaTags.id, question.tagId))
      .limit(1);

    // Get all messages for this question
    const messages = await db
      .select()
      .from(questionMessages)
      .where(eq(questionMessages.questionId, id))
      .orderBy(desc(questionMessages.createdAt));

    // Filter for the answer (message not from the asker)
    const answerMessage = messages.find(msg => msg.senderUserId !== question.askerUserId);
    const answerBody = answerMessage?.body || '';

    const questionDetail = {
      id: question.id.toString(),
      question: question.questionText || '',
      areaName: area?.name || '',
      tagName: tag?.name || '',
      answer: answerBody,
      sources: [], // TODO: Extract sources from answer content if needed
    };

    return res.json(questionDetail);
  } catch (err) {
    console.error('Error serving apologetics question:', err);
    return res.status(500).json(buildErrorResponse('Error loading question', err));
  }
});

// ============================================================================
// BOOKMARK ENDPOINTS - User saved Q&A items
// ============================================================================

// GET /apologetics/bookmarks - Get all bookmarks for current user
router.get('/apologetics/bookmarks', isAuthenticated, apologeticsLimiter, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { db } = await import('../db');
    const { apologeticsBookmarks, userQuestions, qaAreas, qaTags } = await import('@shared/schema');
    const { eq, desc } = await import('drizzle-orm');

    // Get all bookmarked question IDs for this user
    const bookmarks = await db
      .select()
      .from(apologeticsBookmarks)
      .where(eq(apologeticsBookmarks.userId, userId))
      .orderBy(desc(apologeticsBookmarks.createdAt));

    const questionIds = bookmarks.map(b => b.questionId);

    if (questionIds.length === 0) {
      return res.json([]);
    }

    // Return just the question IDs for the mobile app
    return res.json(questionIds.map(id => id.toString()));
  } catch (err) {
    console.error('Error getting bookmarks:', err);
    return res.status(500).json(buildErrorResponse('Error loading bookmarks', err));
  }
});

// POST /apologetics/bookmarks - Add a bookmark
router.post('/apologetics/bookmarks', isAuthenticated, apologeticsLimiter, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { questionId } = req.body;
    if (!questionId) {
      return res.status(400).json({ message: 'questionId is required' });
    }

    const parsedQuestionId = parseInt(questionId, 10);
    if (Number.isNaN(parsedQuestionId)) {
      return res.status(400).json({ message: 'Invalid questionId' });
    }

    const { db } = await import('../db');
    const { apologeticsBookmarks } = await import('@shared/schema');

    // Insert bookmark (unique constraint will prevent duplicates)
    await db
      .insert(apologeticsBookmarks)
      .values({
        userId,
        questionId: parsedQuestionId,
      } as any)
      .onConflictDoNothing();

    return res.status(201).json({ ok: true, questionId: parsedQuestionId });
  } catch (err) {
    console.error('Error adding bookmark:', err);
    return res.status(500).json(buildErrorResponse('Error adding bookmark', err));
  }
});

// DELETE /apologetics/bookmarks/:questionId - Remove a bookmark
router.delete('/apologetics/bookmarks/:questionId', isAuthenticated, apologeticsLimiter, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const questionId = parseInt(req.params.questionId, 10);
    if (Number.isNaN(questionId)) {
      return res.status(400).json({ message: 'Invalid questionId' });
    }

    const { db } = await import('../db');
    const { apologeticsBookmarks } = await import('@shared/schema');
    const { eq, and } = await import('drizzle-orm');

    // Delete the bookmark
    await db
      .delete(apologeticsBookmarks)
      .where(
        and(
          eq(apologeticsBookmarks.userId, userId),
          eq(apologeticsBookmarks.questionId, questionId)
        )
      );

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error removing bookmark:', err);
    return res.status(500).json(buildErrorResponse('Error removing bookmark', err));
  }
});

// GET /apologetics/bookmarks/check/:questionId - Check if question is bookmarked
router.get('/apologetics/bookmarks/check/:questionId', isAuthenticated, apologeticsLimiter, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const questionId = parseInt(req.params.questionId, 10);
    if (Number.isNaN(questionId)) {
      return res.status(400).json({ message: 'Invalid questionId' });
    }

    const { db } = await import('../db');
    const { apologeticsBookmarks } = await import('@shared/schema');
    const { eq, and } = await import('drizzle-orm');

    const [bookmark] = await db
      .select()
      .from(apologeticsBookmarks)
      .where(
        and(
          eq(apologeticsBookmarks.userId, userId),
          eq(apologeticsBookmarks.questionId, questionId)
        )
      )
      .limit(1);

    return res.json({ isBookmarked: !!bookmark });
  } catch (err) {
    console.error('Error checking bookmark:', err);
    return res.status(500).json(buildErrorResponse('Error checking bookmark', err));
  }
});

// Admin guard wrapper to give clearer 403s (isAdmin already checks session).
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Reuse isAdmin middleware but allow direct use
  return (isAdmin as any)(req, res, next);
};

const slugify = (value: string) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Admin CRUD endpoints for apologetics resources (edit the JSON file used by the site).
router.get('/apologetics/admin/resources', requireAdmin, async (_req, res) => {
  try {
    const resources = await storage.getAllApologeticsResources();
    return res.json(resources);
  } catch (err) {
    console.error('Error loading resources:', err);
    return res.status(500).json(buildErrorResponse('Error loading resources', err));
  }
});

router.post('/apologetics/admin/resources', requireAdmin, async (req, res) => {
  try {
    const { title, description, type, url, iconName } = req.body || {};
    if (!title || !description || !type) {
      return res.status(400).json({ message: 'title, description, and type are required' });
    }
    const allowedTypes = ['book', 'podcast', 'video', 'article', 'link'];
    if (!allowedTypes.includes(String(type))) {
      return res.status(400).json({ message: `type must be one of: ${allowedTypes.join(', ')}` });
    }

    const newResource = await storage.createApologeticsResource({
      title,
      description,
      type,
      url: url || '',
      iconName: iconName || 'book',
    });
    return res.status(201).json(newResource);
  } catch (err) {
    console.error('Error creating apologetics resource:', err);
    return res.status(500).json(buildErrorResponse('Server error creating resource', err));
  }
});

router.patch('/apologetics/admin/resources/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    const allowedTypes = ['book', 'podcast', 'video', 'article', 'link'];
    const incoming = req.body || {};
    if (incoming.type && !allowedTypes.includes(String(incoming.type))) {
      return res.status(400).json({ message: `type must be one of: ${allowedTypes.join(', ')}` });
    }

    const updated = await (storage as any).updateApologeticsResource(id, incoming);
    if (!updated) return res.status(404).json({ message: 'Resource not found' });
    return res.json(updated);
  } catch (err) {
    console.error('Error updating apologetics resource:', err);
    return res.status(500).json(buildErrorResponse('Server error updating resource', err));
  }
});

router.delete('/apologetics/admin/resources/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    const deleted = await (storage as any).deleteApologeticsResource(id);
    if (!deleted) return res.status(404).json({ message: 'Resource not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting apologetics resource:', err);
    return res.status(500).json(buildErrorResponse('Server error deleting resource', err));
  }
});

// Admin CRUD for topics
router.get('/apologetics/admin/topics', requireAdmin, async (_req, res) => {
  try {
    const topics = await storage.getAllApologeticsTopics();
    return res.json(topics);
  } catch (err) {
    console.error('Error loading topics:', err);
    return res.status(500).json(buildErrorResponse('Error loading topics', err));
  }
});

router.post('/apologetics/admin/topics', requireAdmin, async (req, res) => {
  try {
    const { name, description, iconName, slug } = req.body || {};
    const parsed = insertApologeticsTopicSchema.safeParse({
      name,
      description,
      iconName,
      slug: slug || slugify(name),
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return res.status(400).json({ message: first?.message || 'Invalid payload' });
    }
    const topic = await storage.createApologeticsTopic(parsed.data);
    return res.status(201).json(topic);
  } catch (err) {
    console.error('Error creating apologetics topic:', err);
    return res.status(500).json(buildErrorResponse('Server error creating topic', err));
  }
});

router.patch('/apologetics/admin/topics/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    const incoming = req.body || {};
    if (incoming.slug) {
      incoming.slug = slugify(incoming.slug);
    } else if (incoming.name) {
      incoming.slug = slugify(incoming.name);
    }
    const updated = await (storage as any).updateApologeticsTopic(id, incoming);
    if (!updated) return res.status(404).json({ message: 'Topic not found' });
    return res.json(updated);
  } catch (err) {
    console.error('Error updating apologetics topic:', err);
    return res.status(500).json(buildErrorResponse('Server error updating topic', err));
  }
});

router.delete('/apologetics/admin/topics/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    const deleted = await (storage as any).deleteApologeticsTopic(id);
    if (!deleted) return res.status(404).json({ message: 'Topic not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting apologetics topic:', err);
    return res.status(500).json(buildErrorResponse('Server error deleting topic', err));
  }
});

// Simple admin UI (HTML) for managing apologetics resources.
router.get('/apologetics/admin', requireAdmin, (_req, res) => {
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Apologetics Admin</title>
      <style>
        body { font-family: sans-serif; margin: 24px; }
        form { display: grid; gap: 8px; max-width: 480px; margin-bottom: 24px; }
        input, textarea, select { padding: 8px; font-size: 14px; }
        table { border-collapse: collapse; width: 100%; margin-top: 16px; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
        th { background: #f3f4f6; }
        .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #eef2ff; }
        .actions button { margin-right: 8px; }
        .muted { color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Apologetics Admin</h1>
      <h2>Resources</h2>
      <form id="create-form">
        <input name="title" placeholder="Title" required />
        <textarea name="description" placeholder="Description" rows="3" required></textarea>
        <select name="type" required>
          <option value="book">Book</option>
          <option value="podcast">Podcast</option>
          <option value="video">Video</option>
          <option value="article">Article</option>
          <option value="link">Link</option>
        </select>
        <input name="url" placeholder="URL (optional)" />
        <input name="iconName" placeholder="Icon name (optional)" />
        <button type="submit">Create</button>
      </form>
      <div id="status" class="muted"></div>
      <table id="resources">
        <thead><tr><th>ID</th><th>Title</th><th>Type</th><th>URL</th><th>Updated</th><th>Actions</th></tr></thead>
        <tbody></tbody>
      </table>

      <h2>Topics</h2>
      <form id="topic-form">
        <input name="name" placeholder="Name" required />
        <textarea name="description" placeholder="Description" rows="2" required></textarea>
        <input name="iconName" placeholder="Icon name (emoji or class)" required />
        <input name="slug" placeholder="Slug (optional, auto from name)" />
        <button type="submit">Create Topic</button>
      </form>
      <table id="topics">
        <thead><tr><th>ID</th><th>Name</th><th>Slug</th><th>Actions</th></tr></thead>
        <tbody></tbody>
      </table>
      <script>
        async function fetchResources() {
          const res = await fetch('/apologetics/admin/resources');
          const data = await res.json();
          const tbody = document.querySelector('#resources tbody');
          tbody.innerHTML = '';
          data.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td>' + r.id + '</td>' +
              '<td>' + (r.title || '') + '<div class="muted">' + (r.description || '') + '</div></td>' +
              '<td><span class="pill">' + r.type + '</span></td>' +
              '<td>' + (r.url ? '<a href=\"' + r.url + '\" target=\"_blank\">Link</a>' : '') + '</td>' +
              '<td>' + (r.createdAt || '') + '</td>' +
              '<td class="actions">' +
                '<button data-action="edit" data-id="' + r.id + '">Edit</button>' +
                '<button data-action="delete" data-id="' + r.id + '">Delete</button>' +
              '</td>';
            tbody.appendChild(tr);
          });
        }

        async function createResource(evt) {
          evt.preventDefault();
          const form = evt.target;
          const payload = Object.fromEntries(new FormData(form).entries());
          const res = await fetch('/apologetics/admin/resources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const msg = await res.json().catch(() => ({}));
            document.getElementById('status').textContent = 'Error: ' + (msg.message || res.statusText);
          } else {
            form.reset();
            document.getElementById('status').textContent = 'Created.';
            fetchResources();
          }
        }

        document.getElementById('create-form').addEventListener('submit', createResource);

        document.querySelector('#resources').addEventListener('click', async (evt) => {
          const btn = evt.target.closest('button');
          if (!btn) return;
          const id = btn.getAttribute('data-id');
          const action = btn.getAttribute('data-action');
          if (action === 'delete') {
            if (!confirm('Delete resource #' + id + '?')) return;
            const res = await fetch('/apologetics/admin/resources/' + id, { method: 'DELETE' });
            if (res.ok) { fetchResources(); }
          } else if (action === 'edit') {
            const title = prompt('New title (leave blank to keep current):');
            const description = prompt('New description (leave blank to keep current):');
            const type = prompt('Type (book,podcast,video,article,link) or blank to keep:');
            const url = prompt('URL (blank to keep):');
            const iconName = prompt('Icon name (blank to keep):');
            const body = {};
            if (title) body.title = title;
            if (description) body.description = description;
            if (type) body.type = type;
            if (url) body.url = url;
            if (iconName) body.iconName = iconName;
            const res = await fetch('/apologetics/admin/resources/' + id, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            if (res.ok) { fetchResources(); }
          }
        });

        // Topics
        async function fetchTopics() {
          const res = await fetch('/apologetics/admin/topics');
          const data = await res.json();
          const tbody = document.querySelector('#topics tbody');
          tbody.innerHTML = '';
          data.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td>' + t.id + '</td>' +
              '<td>' + (t.name || '') + '<div class="muted">' + (t.description || '') + '</div></td>' +
              '<td>' + (t.slug || '') + '</td>' +
              '<td class="actions">' +
                '<button data-action="edit-topic" data-id="' + t.id + '">Edit</button>' +
                '<button data-action="delete-topic" data-id="' + t.id + '">Delete</button>' +
              '</td>';
            tbody.appendChild(tr);
          });
        }

        async function createTopic(evt) {
          evt.preventDefault();
          const form = evt.target;
          const payload = Object.fromEntries(new FormData(form).entries());
          if (!payload.slug && payload.name) {
            payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          }
          const res = await fetch('/apologetics/admin/topics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const msg = await res.json().catch(() => ({}));
            document.getElementById('status').textContent = 'Error: ' + (msg.message || res.statusText);
          } else {
            form.reset();
            document.getElementById('status').textContent = 'Topic created.';
            fetchTopics();
          }
        }

        document.getElementById('topic-form').addEventListener('submit', createTopic);

        document.querySelector('#topics').addEventListener('click', async (evt) => {
          const btn = evt.target.closest('button');
          if (!btn) return;
          const id = btn.getAttribute('data-id');
          const action = btn.getAttribute('data-action');
          if (action === 'delete-topic') {
            if (!confirm('Delete topic #' + id + '?')) return;
            const res = await fetch('/apologetics/admin/topics/' + id, { method: 'DELETE' });
            if (res.ok) { fetchTopics(); }
          } else if (action === 'edit-topic') {
            const name = prompt('New name (blank to keep):');
            const description = prompt('New description (blank to keep):');
            const iconName = prompt('Icon name (blank to keep):');
            const slug = prompt('Slug (blank to keep):');
            const body = {};
            if (name) body.name = name;
            if (description) body.description = description;
            if (iconName) body.iconName = iconName;
            if (slug) body.slug = slug;
            const res = await fetch('/apologetics/admin/topics/' + id, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            if (res.ok) { fetchTopics(); }
          }
        });

        fetchResources();
        fetchTopics();
      </script>
    </body>
  </html>`;
  return res.send(html);
});

export default router;
