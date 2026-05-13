import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function OTPPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { updateUser } = useAuth();
  const userId = state?.userId;

  const handleChange = (val, i) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val;
    setOtp(newOtp);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) return toast.error("Enter all 6 digits");
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { userId, otp: code });
      updateUser({ isVerified: true });
      toast.success("Email verified! 🎉");
      navigate("/home");
    } catch(e) {} finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Syne" }}>Verify Email</h2>
          <p className="text-slate-400 mb-8 text-sm">Enter the 6-digit code sent to your email</p>
          <div className="flex gap-3 justify-center mb-8">
            {otp.map((digit, i) => (
              <input
                key={i} ref={el => refs.current[i] = el}
                value={digit} onChange={e => handleChange(e.target.value, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                maxLength={1}
                className="w-11 h-12 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:bg-white/10 transition"
              />
            ))}
          </div>
          <button onClick={handleVerify} disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl disabled:opacity-60 transition shadow-lg shadow-purple-500/25">
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
