import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (user?.role !== "admin") return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-white font-bold text-xl mb-2">Access Denied</h2>
        <p className="text-slate-400 mb-6">Admin access required</p>
        <button onClick={() => navigate("/home")} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl">Go Home</button>
      </div>
    </div>
  );

  const stats = [
    { label: "Total Users", value: "1,234", icon: "👥", color: "from-purple-600 to-purple-800" },
    { label: "Active Chats", value: "456", icon: "💬", color: "from-cyan-600 to-cyan-800" },
    { label: "Messages Today", value: "12,890", icon: "📨", color: "from-green-600 to-green-800" },
    { label: "AI Queries", value: "2,341", icon: "🤖", color: "from-orange-600 to-orange-800" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0e17] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/home")} className="text-slate-400 hover:text-white text-xl">←</button>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Syne" }}>Admin Dashboard</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className={"glass rounded-2xl p-5 bg-gradient-to-br " + s.color + " bg-opacity-10"}>
              <div className="text-3xl mb-2">{s.icon}</div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
          <p className="text-slate-500 text-sm">Connect your MongoDB to see real-time data</p>
        </div>
      </div>
    </div>
  );
}
