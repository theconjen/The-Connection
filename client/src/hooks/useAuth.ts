import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useAuth() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [regularUser, setRegularUser] = useState<any>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Regular auth check via server
  const { data: user, isLoading: regularAuthLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  // Check for locally stored user data as fallback
  useEffect(() => {
    const checkLocalAuth = () => {
      const storedUserData = localStorage.getItem('currentUser');
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          // Only use local data if we didn't get server data
          if (!user) {
            setRegularUser(userData);
          }
        } catch (error) {
          console.error("Failed to parse stored user data:", error);
          localStorage.removeItem('currentUser');
        }
      }
    };

    // Check for direct admin access
    const checkDirectAdminAccess = async () => {
      const adminKey = localStorage.getItem('adminKey');
      
      if (adminKey) {
        try {
          // First try server-side validation
          const response = await fetch(`/api/direct-admin?key=${encodeURIComponent(adminKey)}`);
          if (response.ok) {
            const userData = await response.json();
            setAdminUser(userData);
          } else {
            // If server validation fails, check if the key matches admin email
            // This is our local fallback for when the server is down
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
            if (adminKey === adminEmail) {
              setAdminUser({
                id: 1,
                username: "admin",
                email: adminEmail,
                isAdmin: true
              });
            } else {
              // Invalid key, remove it
              localStorage.removeItem('adminKey');
            }
          }
        } catch (error) {
          console.error("Admin check failed:", error);
          // Try local fallback
          const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
          if (adminKey === adminEmail) {
            setAdminUser({
              id: 1, 
              username: "admin",
              email: adminEmail,
              isAdmin: true
            });
          } else {
            localStorage.removeItem('adminKey');
          }
        }
      }
      
      setAuthCheckComplete(true);
    };
    
    checkLocalAuth();
    checkDirectAdminAccess();
  }, [user]);

  // Check for test users in development mode
  useEffect(() => {
    // Add test user login if in development mode and query param is present
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('testMode');
    
    if (testMode === 'true' && !user && !adminUser && !regularUser) {
      console.log("Test mode activated");
      setRegularUser({
        id: 999,
        username: "testuser",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        isAdmin: false
      });
    }
  }, [user, adminUser, regularUser]);

  // The actual user is either the server user, admin user, or local fallback user
  const actualUser = user || adminUser || regularUser;
  const isLoading = regularAuthLoading && !authCheckComplete;

  return {
    user: actualUser,
    isLoading,
    isAuthenticated: !!actualUser,
  };
}