import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth state is derived from the httpOnly session cookie via /api/me — the
 * source of truth is the server, not localStorage. We keep a light copy of the
 * user in state for rendering.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh(): Promise<void> {
    try {
      const me = await api.get<never>("/me");
      if (me.logged_in) {
        // /me is minimal; hydrate the rest from /profile when available.
        try {
          const profile = await api.get<AuthUser>("/profile");
          setUser(profile.data as AuthUser);
        } catch {
          setUser({
            id: Number(me.user_id),
            email: String(me.email),
            role: me.role === "admin" ? "admin" : "customer",
            first_name: "",
            last_name: "",
            phone: "",
          });
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout(): Promise<void> {
    await api.post("/auth/logout").catch(() => undefined);
    setUser(null);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(
    () => ({ user, loading, setUser, refresh, logout }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
