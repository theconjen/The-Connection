import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define types for login data and auth context
type LoginData = Pick<InsertUser, "username" | "password">;

export type AuthContextType = {
  user: SelectUser | undefined;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

export function useAuth(): AuthContextType {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        return await res.json();
      } catch (error) {
        // Enhance error messages for common authentication issues
        if (error instanceof Error) {
          if (error.message.includes('401')) {
            throw new Error('Invalid username or password. Please try again.');
          } else if (error.message.includes('429')) {
            throw new Error('Too many login attempts. Please try again later.');
          }
        }
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      // Force refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Welcome back!",
        description: `You've successfully logged in as ${user.username}.`,
        variant: "default",
      });
      
      // Delay navigation slightly to ensure state is updated
      setTimeout(() => {
        import("wouter/use-browser-location").then(({ navigate }) => {
          navigate("/");
        });
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      try {
        const res = await apiRequest("POST", "/api/register", credentials);
        return await res.json();
      } catch (error) {
        // Enhance error messages for common registration issues
        if (error instanceof Error) {
          if (error.message.includes('exists')) {
            throw new Error('This username or email is already in use. Please try another one.');
          } else if (error.message.includes('validation')) {
            throw new Error('Please check your information and try again.');
          }
        }
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      // Force refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Account created!",
        description: `Welcome to The Connection, ${user.username}! Your account has been created.`,
        variant: "default",
      });
      
      // Delay navigation slightly to ensure state is updated
      setTimeout(() => {
        import("wouter/use-browser-location").then(({ navigate }) => {
          navigate("/onboarding");
        });
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/logout");
      } catch (error) {
        // If the server is unreachable, still allow client-side logout
        console.warn("Server logout failed, proceeding with client-side logout:", error);
      }
    },
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Invalidate all queries to ensure fresh data on login
      queryClient.invalidateQueries();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
      
      // Navigate to auth page
      import("wouter/use-browser-location").then(({ navigate }) => {
        navigate("/auth");
      });
    },
    onError: (error: Error) => {
      // For logout errors, still perform client-side logout
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Logout issue",
        description: "Your session has been cleared but there was a server communication issue.",
        variant: "destructive",
      });
      
      // Navigate to auth page even if there was an error
      import("wouter/use-browser-location").then(({ navigate }) => {
        navigate("/auth");
      });
    },
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    loginMutation,
    logoutMutation,
    registerMutation,
  };
}
