"use client";

/**
 * Auth Context and Provider
 * Manages global authentication state
 * Provides sign-up, sign-in, sign-out functions
 */

import React, { createContext, useState, useCallback, useEffect, ReactNode } from "react";
import { clearToken, saveToken, getUser } from "@/lib/auth/jwt-storage";
import { User, AuthError } from "@/lib/api/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  // Restore user from localStorage on mount and listen for storage changes
  useEffect(() => {
    try {
      const savedUser = getUser();
      if (savedUser) {
        setUser(savedUser);
      }
    } catch (err) {
      // If there's an error restoring user, just continue
      console.error("Failed to restore user from localStorage:", err);
    }

    // Listen for storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_user') {
        try {
          if (event.newValue) {
            // Another tab logged in
            const newUser = JSON.parse(event.newValue);
            setUser(newUser);
            setError(null);
            console.log("Auth state synced from another tab: user logged in");
          } else {
            // Another tab logged out
            setUser(null);
            setError(null);
            console.log("Auth state synced from another tab: user logged out");
          }
        } catch (err) {
          console.error("Failed to parse user data from storage event:", err);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });

        if (!response.ok) {
          let errorMessage = "Sign-up failed";
          try {
            const data = await response.json();
            console.error("Backend error response:", data);

            // Try different error message formats
            if (typeof data.detail === 'string') {
              errorMessage = data.detail;
            } else if (data.detail && typeof data.detail === 'object') {
              // Backend returns { detail: { error: "...", message: "..." } }
              if (typeof data.detail.message === 'string') {
                errorMessage = data.detail.message;
              } else if (typeof data.detail.error === 'string') {
                errorMessage = data.detail.error;
              }
            } else if (typeof data.message === 'string') {
              errorMessage = data.message;
            } else if (typeof data.error === 'string') {
              errorMessage = data.error;
            }
          } catch (parseErr) {
            console.error("Failed to parse error response:", parseErr);
            errorMessage = `Sign-up failed (${response.status})`;
          }

          const authError: AuthError = {
            code: "SIGNUP_FAILED",
            message: errorMessage,
          };
          setError(authError);
          throw authError;
        }

        const data = await response.json();
        setUser(data.user);

        // Save token to localStorage
        saveToken(data.token, data.user);

        // Redirect to dashboard page
        if (typeof window !== "undefined") {
          window.location.href = "/dashboard";
        }
      } catch (err) {
        // Don't overwrite auth error that was already set above
        if ((err as AuthError)?.code === "SIGNUP_FAILED") {
          throw err;
        }

        console.error("Sign-up error:", err);
        const errorMessage = err instanceof Error
          ? err.message
          : "Sign-up failed";

        const authError: AuthError = {
          code: "SIGNUP_FAILED",
          message: errorMessage,
        };
        setError(authError);
        throw authError;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = "Sign-in failed";
        try {
          const data = await response.json();
          console.error("Backend error response:", data);

          // Try different error message formats
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (data.detail && typeof data.detail === 'object') {
            // Backend returns { detail: { error: "...", message: "..." } }
            if (typeof data.detail.message === 'string') {
              errorMessage = data.detail.message;
            } else if (typeof data.detail.error === 'string') {
              errorMessage = data.detail.error;
            }
          } else if (typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (typeof data.error === 'string') {
            errorMessage = data.error;
          }
        } catch (parseErr) {
          console.error("Failed to parse error response:", parseErr);
          errorMessage = `Sign-in failed (${response.status})`;
        }

        const authError: AuthError = {
          code: "SIGNIN_FAILED",
          message: errorMessage,
        };
        setError(authError);
        throw authError;
      }

      const data = await response.json();
      setUser(data.user);

      // Save token to localStorage
      saveToken(data.token, data.user);

      // Redirect to dashboard page
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      // Don't overwrite auth error that was already set above
      if ((err as AuthError)?.code === "SIGNIN_FAILED") {
        throw err;
      }

      console.error("Sign-in error:", err);
      const errorMessage = err instanceof Error
        ? err.message
        : "Sign-in failed";

      const authError: AuthError = {
        code: "SIGNIN_FAILED",
        message: errorMessage,
      };
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Clear JWT token from localStorage
      clearToken();
      setUser(null);

      // Redirect to signin page
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signUp,
    signIn,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
