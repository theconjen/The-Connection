// Re-export FEATURES from shared so server code can import a server-local config file.
// This keeps the canonical flags in shared but provides the exact path requested by
// some build and deployment workflows.
import { FEATURES } from '../../shared/features';

export { FEATURES };
