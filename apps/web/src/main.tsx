// Shim entry that re-uses the existing client app entrypoint.
// This keeps the apps/web build working while the monorepo reorganizes sources.
import "../../client/src/main.tsx";

// No exports needed; the client entry mounts itself to #root.
