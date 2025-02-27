"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define authentication context type
interface AuthContextType {
  user: string;
  isAuthenticated: boolean;
  isSuperUser: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Create authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setUser(null);
          setIsAuthenticated(false);
          router.push("/login");
          return;
        }
        const response = await fetch("/api/auth/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
            credentials: "include",
          });
        if (response.ok) {
          const data = await response.json();
          console.log('data check auth'  ,)
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
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        return false // Explicitly throw an error
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.token); // Store token in localStorage
      localStorage.setItem("refreshToken", data.refreshToken);// Store refresh token in localStorage
      setIsSuperUser(data.is_superuser);
      setUser(data.user);
      setIsAuthenticated(true);
      console.log('data check login'  ,data)
      return true
    } catch (error) {
      console.error("Login error:", error);
      return false
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      router.push("/login"); // Redirect to login after logout
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

// Custom hook for using authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
