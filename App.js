// Root shim for Expo in a monorepo: delegate to the mobile app entry
// Expo's default AppEntry imports '../../App' from the project root.
// Create this thin JS file to re-export the actual app living under
// `mobile-app/TheConnectionMobile/App.tsx` so Metro can resolve it.

import App from './mobile-app/TheConnectionMobile/App';

export default App;
