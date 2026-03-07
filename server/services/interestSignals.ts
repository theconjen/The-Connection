/**
 * Interest Signal Tracker
 * Logs user behavior signals that feed into the adaptive recommendation algorithm.
 * Signals decay over time — recent actions matter more than old ones.
 */

import { db } from '../db';
import { userInterestSignals } from '@shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

// Signal types with their default weights
const SIGNAL_WEIGHTS: Record<string, number> = {
  join: 3.0,        // Joining a community is a strong signal
  leave: -2.0,      // Leaving is a strong negative signal
  rsvp: 2.5,        // RSVPing to an event shows clear interest
  rsvp_cancel: -1.0, // Canceling an RSVP
  search: 1.0,      // Searching shows curiosity
  like: 1.5,        // Liking content shows engagement
  comment: 2.0,     // Commenting shows deeper engagement
  pray: 1.5,        // Praying for someone shows community investment
  view: 0.5,        // Viewing a community page (weakest signal)
};

// Map community/event data to normalized interest categories
export function extractCategories(entity: any): string[] {
  const categories: string[] = [];

  // From community tags
  if (entity.ministryTypes) {
    const types = Array.isArray(entity.ministryTypes) ? entity.ministryTypes : [];
    categories.push(...types.map((t: string) => normalizeCategory(t)));
  }
  if (entity.activities) {
    const acts = Array.isArray(entity.activities) ? entity.activities : [];
    categories.push(...acts.map((a: string) => normalizeCategory(a)));
  }
  if (entity.lifeStages) {
    const stages = Array.isArray(entity.lifeStages) ? entity.lifeStages : [];
    categories.push(...stages.map((s: string) => normalizeCategory(s)));
  }
  if (entity.professions) {
    const profs = Array.isArray(entity.professions) ? entity.professions : [];
    categories.push(...profs.map((p: string) => normalizeCategory(p)));
  }
  if (entity.recoverySupport) {
    const recovery = Array.isArray(entity.recoverySupport) ? entity.recoverySupport : [];
    categories.push(...recovery.map((r: string) => normalizeCategory(r)));
  }

  // From event category
  if (entity.category) {
    categories.push(normalizeCategory(entity.category));
  }

  // From gender
  if (entity.gender) {
    categories.push(normalizeCategory(entity.gender));
  }

  return [...new Set(categories.filter(c => c.length > 0))];
}

function normalizeCategory(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Log an interest signal for a user action.
 * Fire-and-forget — never blocks the main request.
 */
export function logSignal(params: {
  userId: number;
  signalType: string;
  entityType: string;
  entityId?: number;
  entity?: any;       // The community/event object — used to extract categories
  searchQuery?: string;
}) {
  const { userId, signalType, entityType, entityId, entity, searchQuery } = params;
  const weight = SIGNAL_WEIGHTS[signalType] ?? 1.0;

  // Extract categories from the entity
  const categories = entity ? extractCategories(entity) : [];

  // Build metadata
  const metadata: any = {};
  if (searchQuery) metadata.query = searchQuery;
  if (categories.length > 0) metadata.categories = categories;
  if (entity?.name) metadata.entityName = entity.name;

  // Log one signal per category (so each interest gets tracked individually)
  // If no categories, log one signal with null category
  const categoriesToLog = categories.length > 0 ? categories : [null];

  if (!db) return; // No database connection

  // Fire and forget — don't await, don't block
  Promise.all(
    categoriesToLog.map(category =>
      db.insert(userInterestSignals).values({
        userId,
        signalType,
        signalCategory: category,
        entityType,
        entityId: entityId ?? null,
        metadata,
        weight: weight.toString(),
      })
    )
  ).catch(err => {
    // Silent fail — signal logging should never break the app
    console.error('Failed to log interest signal:', err.message);
  });
}

/**
 * Get aggregated interest profile for a user from recent signals.
 * Returns a map of category -> score, with time decay applied.
 */
export async function getAdaptiveInterests(userId: number, windowDays: number = 60): Promise<Record<string, number>> {
  if (!db) return {};

  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const signals = await db.select({
    signalCategory: userInterestSignals.signalCategory,
    signalType: userInterestSignals.signalType,
    weight: userInterestSignals.weight,
    createdAt: userInterestSignals.createdAt,
  })
  .from(userInterestSignals)
  .where(and(
    eq(userInterestSignals.userId, userId),
    gte(userInterestSignals.createdAt, cutoff),
  ))
  .orderBy(desc(userInterestSignals.createdAt))
  .limit(500); // Cap to prevent huge queries

  const scores: Record<string, number> = {};

  for (const signal of signals) {
    if (!signal.signalCategory) continue;

    const rawWeight = parseFloat(signal.weight as string) || 1.0;

    // Time decay: signals from today = 1.0x, signals from 60 days ago = 0.1x
    const ageMs = Date.now() - (signal.createdAt?.getTime() ?? Date.now());
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    const decay = Math.max(0.1, 1.0 - (ageDays / windowDays) * 0.9);

    const adjustedWeight = rawWeight * decay;

    scores[signal.signalCategory] = (scores[signal.signalCategory] || 0) + adjustedWeight;
  }

  return scores;
}

/**
 * Get recent entity types the user has been engaging with.
 * Useful for boosting similar community types.
 */
export async function getRecentEntityEngagement(userId: number, windowDays: number = 30): Promise<{
  joinedCommunityIds: number[];
  leftCommunityIds: number[];
  rsvpEventIds: number[];
}> {
  if (!db) return { joinedCommunityIds: [], leftCommunityIds: [], rsvpEventIds: [] };

  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const signals = await db.select({
    signalType: userInterestSignals.signalType,
    entityType: userInterestSignals.entityType,
    entityId: userInterestSignals.entityId,
  })
  .from(userInterestSignals)
  .where(and(
    eq(userInterestSignals.userId, userId),
    gte(userInterestSignals.createdAt, cutoff),
  ));

  const joined: number[] = [];
  const left: number[] = [];
  const rsvps: number[] = [];

  for (const s of signals) {
    if (!s.entityId) continue;
    if (s.signalType === 'join' && s.entityType === 'community') joined.push(s.entityId);
    if (s.signalType === 'leave' && s.entityType === 'community') left.push(s.entityId);
    if (s.signalType === 'rsvp' && s.entityType === 'event') rsvps.push(s.entityId);
  }

  return { joinedCommunityIds: joined, leftCommunityIds: left, rsvpEventIds: rsvps };
}
