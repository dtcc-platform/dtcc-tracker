"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

        const token = localStorage.getItem("authToken");
        if (!token) {
          // Not logged in, redirect to login if they are on a protected route
          setUser(null);
          setIsAuthenticated(false);
          router.push("/login");
          return;
        }

        // Otherwise, verify token with the backend
        const response = await fetch("/tracker/api/auth/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "include",
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

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/tracker/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      setIsSuperUser(data.is_superuser);
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/tracker/api/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isSuperUser, login, logout }}>
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
