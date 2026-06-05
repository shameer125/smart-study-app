import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("ss_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("ss_token"));
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem("ss_token") && !user),
  );

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await authService.getProfile();
        if (!cancelled && data?.user) {
          setUser(data.user);
          localStorage.setItem("ss_user", JSON.stringify(data.user));
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("ss_token");
          localStorage.removeItem("ss_user");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const persist = (u, t) => {
    setUser(u);
    setToken(t);
    if (u) localStorage.setItem("ss_user", JSON.stringify(u));
    if (t) localStorage.setItem("ss_token", t);
  };

  const login = async (creds) => {
    const data = await authService.login(creds);
    persist(data.user, data.token);
    return data;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    persist(data.user, data.token);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("ss_token");
    localStorage.removeItem("ss_user");
  };

  const updateUser = (partial) => {
    setUser((u) => {
      const next = { ...(u || {}), ...partial };
      localStorage.setItem("ss_user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
