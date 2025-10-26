import { Capacitor } from '@capacitor/core';

const NATIVE_API = 'https://api.theconnection.app';   // direct API host
const WEB_API = import.meta.env.VITE_API_BASE || '/api';

export const API_BASE = Capacitor.isNativePlatform() ? NATIVE_API : WEB_API;
