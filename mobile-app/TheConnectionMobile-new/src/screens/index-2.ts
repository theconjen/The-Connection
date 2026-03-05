// This file previously contained a duplicate theme index that caused
// relative imports like `./tokens` from within `src/screens`.
// Keep a tiny forwarder so any accidental imports here resolve to the
// canonical `../theme` index instead.

export * from '../theme';
