/// <reference types="nativewind/types" />

/**
 * React Native global ErrorUtils
 * Used for global error handling
 */
declare const ErrorUtils: {
  setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
  getGlobalHandler: () => ((error: Error, isFatal?: boolean) => void) | undefined;
};
