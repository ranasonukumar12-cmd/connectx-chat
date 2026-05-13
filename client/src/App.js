import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OTPPage from "./pages/OTPPage";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import AdminPage from "./pages/AdminPage";
import GroupPage from "./pages/GroupPage";

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0f0e17]">
      <div className="flex gap-2">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "#1e1b4b",
                  color: "#e2e8f0",
                  border: "1px solid rgba(124,58,237,0.3)",
                },
                success: {
                  iconTheme: { primary: "#7c3aed", secondary: "#fff" },
                },
              }}
            />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-otp" element={<OTPPage />} />
              <Route path="/home" element={<Protected><HomePage /></Protected>} />
              <Route path="/chat/:userId" element={<Protected><ChatPage /></Protected>} />
              <Route path="/group/:groupId" element={<Protected><GroupPage /></Protected>} />
              <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
              <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
              <Route path="/ai" element={<Protected><AIAssistantPage /></Protected>} />
              <Route path="/admin" element={<Protected><AdminPage /></Protected>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}