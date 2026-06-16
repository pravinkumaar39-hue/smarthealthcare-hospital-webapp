import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../api/client";

const AuthContext = createContext(null);

const ROLE_HOME_ROUTES = {
  PATIENT: "/patient/dashboard",
  CITY_ADMIN: "/admin/city/dashboard",
  STATE_ADMIN: "/admin/state/dashboard",
  SUPER_ADMIN: "/admin/super/dashboard",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("sh_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sh_token");
    if (!token) {
      setLoading(false);
      return;
    }
    // Validate token / refresh user info on app load
    getCurrentUser()
      .then((res) => {
        const updated = { ...user, ...res.data };
        setUser(updated);
        localStorage.setItem("sh_user", JSON.stringify(updated));
      })
      .catch(() => {
        localStorage.removeItem("sh_token");
        localStorage.removeItem("sh_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Persist login session.
   * @param {object} tokenResponse - { access_token, role, user_id, name, must_change_password }
   */
  const login = (tokenResponse) => {
    const { access_token, ...userInfo } = tokenResponse;
    localStorage.setItem("sh_token", access_token);
    localStorage.setItem("sh_user", JSON.stringify(userInfo));
    setUser(userInfo);
    return userInfo;
  };

  const logout = () => {
    localStorage.removeItem("sh_token");
    localStorage.removeItem("sh_user");
    setUser(null);
  };

  const updateUser = (patch) => {
    const updated = { ...user, ...patch };
    setUser(updated);
    localStorage.setItem("sh_user", JSON.stringify(updated));
  };

  const homeRouteForRole = (role) => ROLE_HOME_ROUTES[role] || "/login";

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateUser, homeRouteForRole, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
