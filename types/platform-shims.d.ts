// Minimal shims for platform-specific types used in .native files
// These are intentionally permissive to avoid breaking web/server type checks

declare type ViewStyle = any;
declare type TextStyle = any;
declare type ImageStyle = any;

declare module '@radix-ui/react-dialog' {
  export type DialogProps = any;
}
