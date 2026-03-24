import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { apiClient } from "@/integrations/apiClient";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  id: number; // Changed from string to number based on FastAPI model
  username: string;
  email: string;
  // full_name?: string; // Removed full_name
  address?: string;
  phone?: string; // Added phone
  kyc_status: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  signUp: (data: any) => Promise<{ error: any }>;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async (accessToken: string) => {
    try {
      setLoading(true);
      const userData: UserProfile = await apiClient("users/me/", { token: accessToken });
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("accessToken");
      setToken(null);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }

    const handleUnauthorized = () => {
      signOut();
    };

    window.addEventListener("bank:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("bank:unauthorized", handleUnauthorized);
    };
  }, [token, fetchUser]);

  const signUp = async (data: any) => {
    try {
      const newUser = await apiClient("register/", { data });
      return { error: null };
    } catch (error: any) {
      return { error: error.detail || "Sign up failed" };
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      const formBody = new URLSearchParams();
      formBody.append("username", username);
      formBody.append("password", password);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("accessToken", data.access_token);
      setToken(data.access_token);
      await fetchUser(data.access_token); // Fetch user immediately after login
      return { error: null };
    } catch (error: any) {
      console.error("Sign in error:", error);
      return { error: error.message || "Sign in failed" };
    }
  };

  const signOut = () => {
    localStorage.removeItem("accessToken");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login");
  };

  const refreshUser = useCallback(async () => {
    if (token) {
      await fetchUser(token);
    }
  }, [token, fetchUser]);


  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, loading, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

