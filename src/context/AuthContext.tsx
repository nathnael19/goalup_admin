/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { AxiosError } from "axios";
import type { User } from "../types";
import { authService } from "../services/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Optimistic auth state: true if a token exists in storage.
  // This prevents ProtectedRoute from redirecting to /login while
  // the /auth/me call is in-flight or if it fails transiently.
  const [hasToken, setHasToken] = useState(
    () => !!localStorage.getItem("access_token"),
  );
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(() => {
    const stored = localStorage.getItem("session_expires_at");
    return stored ? Number(stored) : null;
  });

  useEffect(() => {
    // Initialize from existing session on the backend
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setHasToken(false);
        setIsLoading(false);
        return;
      }

      try {
        const now = Date.now();
        if (sessionExpiresAt && now > sessionExpiresAt) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("session_expires_at");
          setUser(null);
          setHasToken(false);
          setIsLoading(false);
          return;
        }

        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setHasToken(true);
      } catch (error) {
        console.error("Auth init error:", error);
        // Only clear the session on a definitive 401 Unauthorized response.
        // Transient errors (network issues, 5xx server errors) should NOT log
        // the user out — they may just be a momentary backend hiccup.
        const isUnauthorized =
          error instanceof AxiosError && error.response?.status === 401;
        if (isUnauthorized) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setUser(null);
          setHasToken(false);
        }
        // For other errors, keep hasToken = true so the user stays on the
        // protected page. The axios interceptor handles refresh on next request.
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, remember = true) => {
    const userProfile = await authService.login(email, password);
    setUser(userProfile);
    setHasToken(true);
    const ttlHours = remember ? 72 : 8; // 3 days vs 8 hours
    const expiresAt = Date.now() + ttlHours * 60 * 60 * 1000;
    setSessionExpiresAt(expiresAt);
    localStorage.setItem("session_expires_at", String(expiresAt));
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setHasToken(false);
    setSessionExpiresAt(null);
    localStorage.removeItem("session_expires_at");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        // Authenticated if we have user data OR a token that hasn't been
        // definitively invalidated (i.e. a 401) yet.
        isAuthenticated: !!user || hasToken,
        isLoading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
