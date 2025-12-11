import { beforeEach } from 'vitest';
import { storage } from '../../server/storage';

// Ensure the MemStorage `data` shape exists for tests that inspect or mutate it.
function ensureStorageShape() {
  try {
    const s: any = storage as any;
    if (!s) return;

    if (!s.data || typeof s.data !== 'object') s.data = {};

    const arrKeys = [
      'users', 'communities', 'communityMembers', 'communityInvitations', 'communityChatRooms',
      'chatMessages', 'communityWallPosts', 'posts', 'comments', 'groups', 'groupMembers',
      'apologeticsResources', 'livestreams', 'prayerRequests', 'prayers', 'apologeticsTopics',
      'apologeticsQuestions', 'apologeticsAnswers', 'events', 'eventRsvps', 'microblogs',
      'microblogLikes', 'livestreamerApplications', 'apologistScholarApplications',
      'apologeticsAnswererPermissions', 'bibleReadingPlans', 'bibleReadingProgress',
      'bibleStudyNotes', 'userPreferences', 'messages', 'contentReports', 'userBlocks',
      'pushTokens', 'notifications'
    ];

    for (const k of arrKeys) {
      if (!Object.prototype.hasOwnProperty.call(s.data, k) || s.data[k] == null) {
        s.data[k] = [];
      }
    }

    // Some tests read specific helper arrays (pushTokens / notifications) — ensure objects exist
    if (!s.data.pushTokens) s.data.pushTokens = [];
    if (!s.data.notifications) s.data.notifications = [];
  } catch (err) {
    // swallow — we don't want setup to crash tests if storage shape can't be enforced
    // tests that rely on DB will still fail as expected
    // eslint-disable-next-line no-console
    console.warn('init-memory: failed to ensure storage shape', err);
  }
}

// Run before every test file to make sure `storage.data` exists and its arrays are defined.
beforeEach(() => {
  ensureStorageShape();
});

export {};
