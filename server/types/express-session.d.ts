import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number;     // <-- number everywhere
    isAdmin?: boolean;
    isVerifiedApologeticsAnswerer?: boolean;
    email?: string;
    username?: string;
  }
}