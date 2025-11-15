/**
 * Platform-agnostic navigation abstraction
 * Re-exports platform-specific implementation based on .web or .native extension
 */
export { default } from './navigation.native';
export * from './navigation.native';
