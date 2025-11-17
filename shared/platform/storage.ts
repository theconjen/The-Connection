/**
 * Platform-agnostic storage abstraction
 * Re-exports platform-specific implementation based on .web or .native extension
 */
export { default } from './storage.native';
export * from './storage.native';
