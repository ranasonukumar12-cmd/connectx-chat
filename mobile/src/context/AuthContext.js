import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(["connectx_token", "connectx_user"]).then(([[, token], [, u]]) => {
      if (token && u) setUser(JSON.parse(u));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const login = async (token, refreshToken, userData) => {
    await AsyncStorage.multiSet([
      ["connectx_token", token],
      ["connectx_refresh", refreshToken],
      ["connectx_user", JSON.stringify(userData)],
    ]);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["connectx_token", "connectx_refresh", "connectx_user"]);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
