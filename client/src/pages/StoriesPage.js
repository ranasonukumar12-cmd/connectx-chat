import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

export default function StoriesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [myStory, setMyStory] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [bgColor, setBgColor] = useState("#7c3aed");
  const [viewingStory, setViewingStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const BG_COLORS = [
    "#7c3aed", "#dc2626", "#059669", "#d97706",
    "#0891b2", "#be185d", "#1d4ed8", "#374151",
  ];

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const { data } = await api.get("/stories");
      setStories(data.stories || []);
      const mine = data.stories?.find(s => s.user._id === user._id);
      setMyStory(mine || null);
    } catch(e) {}
  };

  const createStory = async () => {
    if (!storyText.trim()) return toast.error("Write something for your story!");
    setLoading(true);
    try {
      await api.post("/stories", {
        content: storyText,
        mediaType: "text",
        backgroundColor: bgColor,
        textColor: "#ffffff",
      });
      toast.success("Story posted! 🎉");
      setShowCreate(false);
      setStoryText("");
      loadStories();
    } catch(e) {
      toast.error("Failed to post story");
    } finally { setLoading(false); }
  };

  const viewStory = (story) => {
    setViewingStory(story);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setViewingStory(null);
          return 0;
        }
        return p + 2;
      });
    }, 100);
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return hours + "h ago";
    return "Yesterday";
  };

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#16213e]/80 backdrop-blur">
        <button onClick={() => navigate("/home")} className="text-slate-400 hover:text-white text-xl">←</button>
        <h1 className="text-white font-bold text-lg">Stories</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* My Story */}
        <div className="mb-6">
          <p className="text-slate-500 text-xs uppercase font-semibold mb-3">My Story</p>
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer" onClick={() => myStory ? viewStory(myStory) : setShowCreate(true)}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl overflow-hidden border-2"
                style={{ borderColor: myStory ? "#7c3aed" : "#374151", background: myStory ? myStory.backgroundColor : "#1e293b" }}
              >
                {myStory
                  ? <span className="text-2xl">{myStory.content?.[0] || "📝"}</span>
                  : user?.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    : user?.name?.[0]?.toUpperCase()
                }
              </div>
              {!myStory && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm border-2 border-[#0f0e17]">+</div>
              )}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{myStory ? "My Story" : "Add Story"}</p>
              <p className="text-slate-500 text-xs">
                {myStory ? timeAgo(myStory.createdAt) : "Share what's on your mind"}
              </p>
            </div>
            {!myStory && (
              <button onClick={() => setShowCreate(true)}
                className="ml-auto px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition">
                + Add
              </button>
            )}
          </div>
        </div>

        {/* Other Stories */}
        {stories.filter(s => s.user._id !== user._id).length > 0 && (
          <div>
            <p className="text-slate-500 text-xs uppercase font-semibold mb-3">Recent</p>
            <div className="space-y-3">
              {stories.filter(s => s.user._id !== user._id).map(story => (
                <motion.div
                  key={story._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => viewStory(story)}
                  className="flex items-center gap-4 p-3 glass rounded-2xl cursor-pointer hover:bg-white/8 transition"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-purple-500 overflow-hidden"
                    style={{ background: story.backgroundColor || "#7c3aed" }}
                  >
                    {story.user?.avatar
                      ? <img src={story.user.avatar} alt="" className="w-full h-full object-cover" />
                      : story.user?.name?.[0]?.toUpperCase()
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{story.user?.name}</p>
                    <p className="text-slate-500 text-xs">{timeAgo(story.createdAt)}</p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: story.backgroundColor + "40" }}
                  >
                    {story.content?.[0] || "📝"}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {stories.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚡</div>
            <p className="text-white font-semibold text-lg mb-2">No Stories Yet</p>
            <p className="text-slate-500 text-sm mb-6">Be the first to share a story!</p>
            <button onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">
              Create Story
            </button>
          </div>
        )}
      </div>

      {/* Create Story Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-lg bg-[#16213e] rounded-t-3xl p-6 border-t border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-white font-bold text-lg mb-4">Create Story</h3>

              {/* Preview */}
              <div
                className="w-full h-48 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden"
                style={{ background: bgColor }}
              >
                <p className="text-white text-xl font-medium text-center px-4">
                  {storyText || "Your story text here..."}
                </p>
              </div>

              {/* Text input */}
              <textarea
                value={storyText}
                onChange={e => setStoryText(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none mb-4"
              />

              {/* Color picker */}
              <p className="text-slate-400 text-xs mb-2">Background Color</p>
              <div className="flex gap-2 mb-4 flex-wrap">
                {BG_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setBgColor(color)}
                    className={"w-8 h-8 rounded-full transition " + (bgColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#16213e]" : "")}
                    style={{ background: color }}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 glass text-slate-400 rounded-xl hover:text-white transition">
                  Cancel
                </button>
                <button onClick={createStory} disabled={loading}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-60 transition font-semibold">
                  {loading ? "Posting..." : "Post Story"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Story Modal */}
      <AnimatePresence>
        {viewingStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: viewingStory.backgroundColor || "#7c3aed" }}
            onClick={() => setViewingStory(null)}
          >
            {/* Progress bar */}
            <div className="absolute top-4 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                style={{ width: progress + "%" }}
              />
            </div>

            {/* User info */}
            <div className="absolute top-8 left-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold overflow-hidden">
                {viewingStory.user?.avatar
                  ? <img src={viewingStory.user.avatar} alt="" className="w-full h-full object-cover" />
                  : viewingStory.user?.name?.[0]?.toUpperCase()
                }
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{viewingStory.user?.name}</p>
                <p className="text-white/60 text-xs">{timeAgo(viewingStory.createdAt)}</p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setViewingStory(null)}
              className="absolute top-8 right-4 text-white text-2xl w-8 h-8 flex items-center justify-center"
            >✕</button>

            {/* Story content */}
            <p className="text-white text-2xl font-bold text-center px-8 leading-relaxed">
              {viewingStory.content}
            </p>

            {/* Viewers count */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <div className="glass px-4 py-2 rounded-full text-white text-sm">
                👁️ {viewingStory.viewers?.length || 0} viewers
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}