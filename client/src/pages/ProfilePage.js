import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    username: user?.username || "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const fileRef = useRef(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return toast.error("Please select an image file");
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/upload/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatar(data.url);
      await api.put("/users/profile", { avatar: data.url });
      updateUser({ avatar: data.url });
      toast.success("Profile picture updated! ✅");
    } catch(e) {
      toast.error("Upload failed. Check Cloudinary settings.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      const { data } = await api.put("/users/profile", { ...form, avatar });
      updateUser(data.user);
      toast.success("Profile updated! ✅");
    } catch(e) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0e17] p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white transition text-xl w-8">←</button>
          <h1 className="text-xl font-bold text-white">My Profile</h1>
        </div>

        <div className="glass rounded-2xl p-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-4xl font-bold text-white overflow-hidden border-4 border-purple-500/30">
                {avatar
                  ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                  : user?.name?.[0]?.toUpperCase()
                }
              </div>
              <div className="absolute bottom-1 right-1 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white border-2 border-[#0f0e17]">
                {uploading ? "⏳" : "📷"}
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-3">
              {uploading ? "Uploading..." : "Click to change photo"}
            </p>
            <p className="text-slate-600 text-xs">@{user?.username}</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          {/* Form */}
          <div className="space-y-4">
            {[
              { label: "Full Name", key: "name", placeholder: "Your name" },
              { label: "Username", key: "username", placeholder: "unique_username" },
              { label: "Bio", key: "bio", placeholder: "Tell us about yourself..." },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm text-slate-400 mb-1.5">{label}</label>
                <input
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                  placeholder={placeholder}
                />
              </div>
            ))}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 py-4 border-t border-white/5">
              {[
                { label: "Messages", value: "0" },
                { label: "Groups", value: "0" },
                { label: "Status", value: user?.isVerified ? "✅" : "❌" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-white font-bold text-lg">{s.value}</p>
                  <p className="text-slate-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={save}
              disabled={loading || uploading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl disabled:opacity-60 transition shadow-lg shadow-purple-500/25 hover:from-purple-500"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>

            <button
              onClick={() => navigate("/settings")}
              className="w-full py-3 glass text-slate-400 font-medium rounded-xl hover:text-white transition"
            >
              ⚙️ Go to Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}