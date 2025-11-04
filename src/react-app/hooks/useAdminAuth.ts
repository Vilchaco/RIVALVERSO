import { useState, useEffect } from "react";

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const verifyAuth = async () => {
    try {
      const response = await fetch("/api/admin/verify", {
        credentials: 'include'
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth verification error:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: 'include'
      });
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
      // Still set to false even if the request fails
      setIsAuthenticated(false);
    }
  };

  const login = () => {
    setIsAuthenticated(true);
  };

  useEffect(() => {
    verifyAuth();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    verifyAuth
  };
}
