/**
 * Platform-agnostic sharing abstraction
 * Re-exports platform-specific implementation based on .web or .native extension
 */
export { default } from './sharing.native';
export * from './sharing.native';
