import 'expo-router/entry';

// The `expo` package's AppEntry expects to import `../../App`.
// This file acts as a shim that delegates to `expo-router`'s entry
// and keeps Metro resolution simple in a monorepo.

export default function App(): null {
  return null;
}
