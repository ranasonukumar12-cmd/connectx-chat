import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("connectx_token");
    const savedUser = localStorage.getItem("connectx_user");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        api.defaults.headers.common["Authorization"] = "Bearer " + token;
      } catch(e) { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  const login = (token, refreshToken, userData) => {
    localStorage.setItem("connectx_token", token);
    localStorage.setItem("connectx_refresh", refreshToken);
    localStorage.setItem("connectx_user", JSON.stringify(userData));
    api.defaults.headers.common["Authorization"] = "Bearer " + token;
    setUser(userData);
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch(e) {}
    localStorage.clear();
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const updateUser = (data) => {
    const newUser = { ...user, ...data };
    setUser(newUser);
    localStorage.setItem("connectx_user", JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
