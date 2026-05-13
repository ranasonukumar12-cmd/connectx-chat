import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col items-center justify-center overflow-hidden relative">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 text-center px-6 max-w-2xl"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-purple-500/30">
            CX
          </div>
          <span className="text-3xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>ConnectX</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>
          Chat. Connect.{" "}
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Evolve.
          </span>
        </h1>

        <p className="text-slate-400 text-lg mb-10 leading-relaxed">
          The next-generation messaging platform with AI, real-time calls, group chats, 
          and end-to-end encryption. Available in English, हिंदी & తెలుగు.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {["🤖 AI Assistant", "🔒 E2E Encrypted", "📱 Mobile Ready", "🌍 Multi-language", "📞 Voice & Video", "👥 Group Chats"].map(f => (
            <span key={f} className="px-4 py-2 glass rounded-full text-sm text-slate-300">{f}</span>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/register")}
            className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
          >
            Get Started Free
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
            className="px-8 py-3.5 glass text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
          >
            Sign In
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
