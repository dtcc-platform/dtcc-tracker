"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

interface AuthContextType {
  user: string;
  isAuthenticated: boolean;
  isSuperUser: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);

  const router = useRouter();
  const pathname = usePathname(); // <-- new

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Define any public (unprotected) routes here
        const publicRoutes = ["/login", "/forgot-password", "/reset", "/some-other-public-route"];

        // If the user is visiting a public route, skip auth checks
        if (publicRoutes.includes(pathname)) {
          return;
        }

        // Verify authentication status with the backend using cookies
        const response = await fetch("/api/auth/token/verify/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Include cookies with the request
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.username);
          setIsSuperUser(data.is_superuser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    checkAuth();
  }, [pathname, router]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Important: include cookies
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      // No longer storing tokens in localStorage - they're in httpOnly cookies
      setIsSuperUser(data.is_superuser);
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear httpOnly cookies
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      setUser(null);
      setIsAuthenticated(false);
      setIsSuperUser(false);
      // Clear any leftover localStorage items from old implementation
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      router.push("/login");
    } catch (error) {
      // Logout failed silently - still clear local state
      setUser(null);
      setIsAuthenticated(false);
      setIsSuperUser(false);
      router.push("/login");
    }
  }, [router]);

  const contextValue = useMemo(
    () => ({ user, isAuthenticated, isSuperUser, login, logout }),
    [user, isAuthenticated, isSuperUser, login, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
