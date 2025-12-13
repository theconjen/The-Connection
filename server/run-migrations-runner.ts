#!/usr/bin/env tsx
import { runAllMigrations } from './run-migrations';

(async () => {
  try {
    const ok = await runAllMigrations();
    process.exit(ok ? 0 : 1);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error running migrations runner:', err);
    process.exit(1);
  }
})();
