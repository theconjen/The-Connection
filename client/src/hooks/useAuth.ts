import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useAuth() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // Regular auth check
  const { data: user, isLoading: regularAuthLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  // Check for direct admin access
  useEffect(() => {
    const checkDirectAdminAccess = async () => {
      const adminKey = localStorage.getItem('adminKey');
      
      if (adminKey) {
        try {
          const response = await fetch(`/api/direct-admin?key=${encodeURIComponent(adminKey)}`);
          if (response.ok) {
            const userData = await response.json();
            setAdminUser(userData);
          } else {
            // Invalid key, remove it
            localStorage.removeItem('adminKey');
          }
        } catch (error) {
          console.error("Admin check failed:", error);
          localStorage.removeItem('adminKey');
        }
      }
      
      setAdminCheckComplete(true);
    };
    
    checkDirectAdminAccess();
  }, []);

  // The actual user is either the regular auth user or the admin user
  const actualUser = user || adminUser;
  const isLoading = regularAuthLoading || !adminCheckComplete;

  return {
    user: actualUser,
    isLoading,
    isAuthenticated: !!actualUser,
  };
}