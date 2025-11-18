// Ambient module shims for native-only or optional packages
declare module '@capacitor/share';
declare module 'expo-router';
declare module 'react-native-share';
declare module '@react-native-async-storage/async-storage';
declare module 'expo-secure-store';
declare module 'react-native';
declare module 'lucide-react-native';
declare module '@radix-ui/react-dialog';
declare module '@radix-ui/react-select';
declare module '@radix-ui/react-label';
declare module 'wouter';

// Allow imports of .native files if any slip through
declare module '*.native.tsx';
declare module '*.native.ts';

// Server dev optional modules
declare module 'isomorphic-dompurify';
declare module 'vite';
