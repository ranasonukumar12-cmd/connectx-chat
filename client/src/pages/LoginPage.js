import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Please fill all fields");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.refreshToken, data.user);
      toast.success("Welcome back, " + data.user.name + "! 👋");
      navigate("/home");
    } catch(e) {
      // Error shown by interceptor
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center p-4">
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-xl font-bold text-white mx-auto mb-4">CX</div>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "Syne" }}>Welcome Back</h2>
            <p className="text-slate-400 mt-1">Sign in to ConnectX</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Email</label>
              <input
                type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:bg-white/8 transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Password</label>
              <input
                type="password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-purple-600 transition disabled:opacity-60 shadow-lg shadow-purple-500/25"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-slate-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium">Register</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
