/**
 * Native environment configuration
 * Uses expo-constants to access EXPO_PUBLIC_API_BASE
 */
import { getApiBase } from './config';

export const API_BASE = getApiBase();

console.log('[env.native] API_BASE:', API_BASE);
