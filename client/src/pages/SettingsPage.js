import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const LANGS = [{ code: "en", label: "English" }, { code: "hi", label: "हिंदी" }, { code: "te", label: "తెలుగు" }];

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const sections = [
    { title: "Account", items: [
      { icon: "👤", label: "Edit Profile", onClick: () => navigate("/profile") },
      { icon: "🔒", label: "Privacy & Security", onClick: () => {} },
      { icon: "🔔", label: "Notifications", onClick: () => {} },
    ]},
    { title: "Appearance", items: [
      { icon: theme === "dark" ? "🌙" : "☀️", label: theme === "dark" ? "Dark Mode" : "Light Mode", onClick: toggleTheme, right: <div className="w-10 h-5 bg-purple-600 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5" /></div> },
    ]},
    { title: "Language", items: LANGS.map(l => ({
      icon: "🌐", label: l.label,
      right: user?.language === l.code && <span className="text-purple-400">✓</span>,
      onClick: () => updateUser({ language: l.code }),
    }))},
    { title: "Advanced", items: [
      { icon: "💾", label: "Chat Backup", onClick: () => {} },
      { icon: "📊", label: "Storage Usage", onClick: () => {} },
      { icon: "ℹ️", label: "About ConnectX v1.0", onClick: () => {} },
    ]},
  ];

  return (
    <div className="min-h-screen bg-[#0f0e17] p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition text-xl">←</button>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Syne" }}>Settings</h1>
        </div>
        <div className="space-y-6">
          {sections.map(s => (
            <div key={s.title} className="glass rounded-2xl overflow-hidden">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 border-b border-white/5">{s.title}</p>
              {s.items.map((item, i) => (
                <button key={i} onClick={item.onClick}
                  className="flex items-center gap-3 w-full px-5 py-3.5 hover:bg-white/5 transition border-b border-white/3 last:border-0">
                  <span className="text-lg w-7">{item.icon}</span>
                  <span className="text-white text-sm flex-1 text-left">{item.label}</span>
                  {item.right || <span className="text-slate-600 text-xs">›</span>}
                </button>
              ))}
            </div>
          ))}
          <button onClick={logout}
            className="w-full py-3.5 glass text-red-400 font-semibold rounded-2xl hover:bg-red-500/10 transition">
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
