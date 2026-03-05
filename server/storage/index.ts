/**
 * Storage module index.
 *
 * This file re-exports the canonical storage instance and IStorage interface
 * from the original monolithic storage.ts. Domain-specific modules in this
 * directory (messages.ts, notifications.ts, etc.) contain extracted, testable
 * implementations that DbStorage delegates to.
 *
 * Migration path:
 * 1. New code should import domain modules directly for unit testing
 * 2. Route handlers continue importing { storage } from here or '../storage'
 * 3. Over time, DbStorage methods are replaced with thin delegates to domain modules
 *
 * Domain modules available:
 * - ./messages    — Direct messaging, reactions, conversations
 * - ./notifications — Push tokens, in-app notifications
 * - ./base        — Shared db import, helpers, utilities
 */

// Re-export the canonical storage instance and interface
export { storage, type IStorage } from '../storage';

// Re-export domain modules for direct import
export * as messageMethods from './messages';
export * as notificationMethods from './notifications';
export { toTsQuery } from './base';
