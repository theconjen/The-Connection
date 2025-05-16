import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { ReactNode } from "react";

/**
 * Protected Route - requires authentication
 * Redirects to /auth if user is not logged in
 */
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        if (!user) {
          return <Redirect to="/auth" />;
        }
        
        return <Component />;
      }}
    </Route>
  );
}

/**
 * Admin Route - requires admin authentication
 * Redirects to / if user is not an admin
 */
export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        if (!user) {
          return <Redirect to="/auth" />;
        }
        
        if (!user.isAdmin) {
          return <Redirect to="/" />;
        }
        
        return <Component />;
      }}
    </Route>
  );
}

/**
 * Read-only Route - allows guests but with limited functionality
 * Component receives isGuest flag to conditionally render UI elements
 */
interface PageComponentProps {
  isGuest?: boolean;
}

type PageComponent = React.ComponentType<PageComponentProps>;

export function ReadOnlyRoute({
  path,
  component: Component,
}: {
  path: string;
  component: PageComponent;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        return <Component isGuest={!user} />;
      }}
    </Route>
  );
}
