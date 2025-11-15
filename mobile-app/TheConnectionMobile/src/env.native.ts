/**
 * Native environment configuration
 * Uses expo-constants to access EXPO_PUBLIC_API_BASE
 */
import Constants from 'expo-constants';

const DEVELOPMENT_API = 'http://localhost:3000/api';
const PRODUCTION_API = 'https://api.theconnection.app';

// Get API_BASE from expo environment variables
// Falls back to production API if not set
export const API_BASE =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE ||
  process.env.EXPO_PUBLIC_API_BASE ||
  (process.env.NODE_ENV === 'development' ? DEVELOPMENT_API : PRODUCTION_API);

console.log('[env.native] API_BASE:', API_BASE);
