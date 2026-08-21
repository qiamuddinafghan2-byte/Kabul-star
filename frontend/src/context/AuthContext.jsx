import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, formatApiError } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=loading, false=guest, obj=user
  const [ready, setReady] = useState(false);

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (_e) {
      setUser(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async ({ email, password, role }) => {
    try {
      const { data } = await api.post("/auth/login", { email, password, role });
      // Pull the full user profile (includes course_id, current_level, progress, etc.)
      await refreshMe();
      return { ok: true, user: data };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail, "Login failed") };
    }
  }, [refreshMe]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (_e) {
      /* ignore */
    }
    setUser(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
