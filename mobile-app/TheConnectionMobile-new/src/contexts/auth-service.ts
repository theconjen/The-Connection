// Lightweight auth-service stub for mobile app development
// Provides minimal API expected by AuthContext to satisfy TypeScript

export interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean;
}

type LoginPayload = { email: string; password: string };

export const authService = {
  async checkAuth(): Promise<User | null> {
    // In dev, return null to indicate unauthenticated by default
    return null;
  },

  async login(_: LoginPayload): Promise<{ user: User } | null> {
    // Return a fake user for local dev if needed
    return {
      user: {
        id: 1,
        email: 'dev@localhost',
        username: 'devuser',
        firstName: 'Dev',
        lastName: 'User',
        isEmailVerified: true,
      },
    };
  },

  async register(data: any): Promise<{ user: User }> {
    // Echo back a created user object (no persistence)
    return {
      user: {
        id: Math.floor(Math.random() * 100000),
        email: data.email,
        username: data.username ?? 'newuser',
        firstName: data.firstName,
        lastName: data.lastName,
        isEmailVerified: false,
      },
    };
  },

  async logout(): Promise<void> {
    return;
  },

  async verifyEmail(_code: string): Promise<void> {
    return;
  },

  async resendVerificationEmail(): Promise<void> {
    return;
  },
};
