import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import toast from "react-hot-toast";

const formatTime = (date) => format(new Date(date), "h:mm a");
const formatDate = (date) => {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
};

const EMOJIS = ["👍","❤️","😂","😮","😢","🔥","👏","🎉","😍","🙏","😎","🤔"];
const QUICK_EMOJIS = ["😊","😂","❤️","👍","🔥","😭","🙌","😍","🤣","😘","👋","🎉"];

export default function ChatPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { emit, on, onlineUsers } = useSocket();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [contact, setContact] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showReaction, setShowReaction] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [smartReplies, setSmartReplies] = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCallModal, setShowCallModal] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callActive, setCallActive] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [starredMessages, setStarredMessages] = useState([]);
  const [showStarred, setShowStarred] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const callTimer = useRef(null);
  const searchRefs = useRef({});

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const getSenderId = (msg) => {
    if (!msg.sender) return "";
    if (typeof msg.sender === "string") return msg.sender;
    if (typeof msg.sender === "object") return msg.sender._id || msg.sender.id || "";
    return "";
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/users/" + userId),
      api.get("/messages/" + userId),
    ]).then(([{ data: ud }, { data: md }]) => {
      setContact(ud.user);
      setMessages(md.messages || []);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }).catch(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const offMsg = on("receive_message", (msg) => {
      const senderId = getSenderId(msg);
      if (senderId === userId || senderId === user._id ||
        msg.receiver === user._id || msg.receiver?._id === user._id) {
        setMessages(p => {
          const exists = p.find(m => m._id === msg._id || m.tempId === msg.tempId);
          if (exists) return p.map(m => (m.tempId === msg.tempId ? msg : m));
          return [...p, msg];
        });
        setTimeout(scrollToBottom, 50);
        if (senderId !== user._id) {
          emit("seen", { messageId: msg._id, senderId });
        }
      }
    });
    const offTyping = on("typing", ({ userId: tid }) => { if (tid === userId) setIsTyping(true); });
    const offStop = on("stop_typing", ({ userId: tid }) => { if (tid === userId) setIsTyping(false); });
    const offSeen = on("message_seen", ({ messageId }) => {
      setMessages(p => p.map(m =>
        m._id === messageId ? { ...m, seenBy: [...(m.seenBy || []), userId] } : m
      ));
    });
    return () => { offMsg(); offTyping(); offStop(); offSeen(); };
  }, [userId, user._id, emit, on]);

  // Search messages
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const results = messages.filter(m =>
      m.content?.toLowerCase().includes(searchQuery.toLowerCase()) && !m.isDeleted
    );
    setSearchResults(results);
    setCurrentSearchIndex(0);
    if (results.length > 0) {
      searchRefs.current[results[0]._id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [searchQuery, messages]);

  const navigateSearch = (dir) => {
    if (searchResults.length === 0) return;
    const newIndex = (currentSearchIndex + dir + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(newIndex);
    searchRefs.current[searchResults[newIndex]._id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const sendMessage = useCallback(async (text = input, type = "text") => {
    if (!text.trim() && type === "text") return;
    const tempId = Date.now().toString();
    const tempMsg = {
      _id: tempId, tempId, content: text, type,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      receiver: userId, createdAt: new Date().toISOString(),
      replyTo: replyTo, isSending: true, seenBy: [],
    };
    setMessages(p => [...p, tempMsg]);
    setInput(""); setReplyTo(null); setShowEmoji(false);
    setTimeout(scrollToBottom, 50);
    emit("send_message", { receiverId: userId, content: text, type, replyTo: replyTo?._id, tempId });
    try {
      const { data } = await api.post("/ai/smart-reply", { message: text });
      setSmartReplies(data.suggestions || []);
    } catch(e) {}
  }, [input, user, userId, replyTo, emit]);

  const handleTyping = (val) => {
    setInput(val);
    emit("typing", { receiverId: userId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emit("stop_typing", { receiverId: userId }), 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/upload/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const type = file.type.startsWith("image/") ? "image" :
                   file.type.startsWith("video/") ? "video" :
                   file.type.startsWith("audio/") ? "audio" : "file";
      sendMessage(data.url, type);
    } catch(e) {} finally { setUploading(false); }
  };

  const deleteMessage = async (msgId) => {
    try {
      await api.delete("/messages/" + msgId);
      setMessages(p => p.map(m =>
        m._id === msgId ? { ...m, isDeleted: true, content: "This message was deleted" } : m
      ));
      setSelectedMsg(null);
    } catch(e) {}
  };

  const reactToMessage = async (msgId, emoji) => {
    try {
      const { data } = await api.put("/messages/" + msgId + "/react", { emoji });
      setMessages(p => p.map(m => m._id === msgId ? { ...m, reactions: data.reactions } : m));
      setShowReaction(null);
    } catch(e) {}
  };

  const handleBlock = async () => {
    if (!window.confirm("Block " + contact?.name + "?")) return;
    try {
      await api.post("/users/block/" + userId);
      toast.success("User blocked!");
      navigate("/home");
    } catch(e) { toast.error("Failed to block user"); }
  };

  const handleClearChat = () => {
    if (!window.confirm("Clear all messages?")) return;
    setMessages([]);
    toast.success("Chat cleared!");
  };

  const starMessage = (msg) => {
    const isStarred = starredMessages.find(m => m._id === msg._id);
    if (isStarred) {
      setStarredMessages(p => p.filter(m => m._id !== msg._id));
      toast.success("Message unstarred");
    } else {
      setStarredMessages(p => [...p, msg]);
      toast.success("Message starred ⭐");
    }
    setSelectedMsg(null);
  };

  const pinMessage = (msg) => {
    setPinnedMessage(pinnedMessage?._id === msg._id ? null : msg);
    toast.success(pinnedMessage?._id === msg._id ? "Message unpinned" : "Message pinned 📌");
    setSelectedMsg(null);
  };

  const forwardMessage = (msg) => {
    setForwardMsg(msg);
    toast.success("Select a chat to forward to");
    navigate("/home");
  };

  const startCall = (type) => {
    setShowCallModal(type);
    setCallDuration(0);
    setCallActive(false);
    setTimeout(() => {
      setCallActive(true);
      callTimer.current = setInterval(() => {
        setCallDuration(p => p + 1);
      }, 1000);
    }, 3000);
    emit("call_user", { receiverId: userId, callType: type });
  };

  const endCall = () => {
    clearInterval(callTimer.current);
    setShowCallModal(null);
    setCallActive(false);
    setCallDuration(0);
    emit("call_ended", { receiverId: userId });
    toast.success("Call ended");
  };

  const formatCallTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return m + ":" + s;
  };

  const grouped = messages.reduce((acc, msg) => {
    const date = formatDate(msg.createdAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  const isOnline = onlineUsers.has(userId) || contact?.isOnline;

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp("(" + query + ")", "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-yellow-400 text-black rounded px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <div
      className="flex h-screen bg-[#0f0e17] overflow-hidden flex-col"
      onClick={() => { setShowMoreMenu(false); setSelectedMsg(null); setShowEmoji(false); setShowAttach(false); }}
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#16213e]/80 backdrop-blur">
        {showSearch ? (
          // Search Bar
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="text-slate-400 hover:text-white text-xl">←</button>
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition text-sm"
            />
            {searchResults.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-slate-400 text-xs">{currentSearchIndex + 1}/{searchResults.length}</span>
                <button onClick={() => navigateSearch(-1)} className="w-7 h-7 glass rounded-lg flex items-center justify-center text-slate-400 hover:text-white">↑</button>
                <button onClick={() => navigateSearch(1)} className="w-7 h-7 glass rounded-lg flex items-center justify-center text-slate-400 hover:text-white">↓</button>
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <span className="text-slate-500 text-xs flex-shrink-0">No results</span>
            )}
          </div>
        ) : (
          // Normal Header
          <>
            <button onClick={() => navigate("/home")} className="text-slate-400 hover:text-white transition text-xl w-8">←</button>
            <div className="relative cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold overflow-hidden">
                {contact?.avatar
                  ? <img src={contact.avatar} alt="" className="w-full h-full object-cover" />
                  : contact?.name?.[0]?.toUpperCase()}
              </div>
              {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#16213e]" />}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{contact?.name || "..."}</p>
              <p className="text-xs text-slate-500">
                {isTyping
                  ? <span className="text-purple-400 animate-pulse">typing...</span>
                  : isOnline ? <span className="text-green-400">Online</span> : "Offline"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 relative">
              <button onClick={(e) => { e.stopPropagation(); startCall("voice"); }}
                className="w-9 h-9 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-green-400 transition">📞</button>
              <button onClick={(e) => { e.stopPropagation(); startCall("video"); }}
                className="w-9 h-9 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-cyan-400 transition">📹</button>
              <button onClick={(e) => { e.stopPropagation(); setShowMoreMenu(p => !p); }}
                className={"w-9 h-9 rounded-xl flex items-center justify-center transition " + (showMoreMenu ? "bg-purple-600 text-white" : "glass text-slate-400 hover:text-white")}>⋮</button>

              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 top-11 z-50 w-56 bg-[#16213e] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                    onClick={e => e.stopPropagation()}
                  >
                    {[
                      { icon: "🔍", label: "Search Messages", onClick: () => { setShowSearch(true); setShowMoreMenu(false); } },
                      { icon: "⭐", label: "Starred Messages", onClick: () => { setShowStarred(true); setShowMoreMenu(false); } },
                      { icon: "👤", label: "View Profile", onClick: () => { navigate("/profile"); setShowMoreMenu(false); } },
                      { icon: "📋", label: "Copy Username", onClick: () => { navigator.clipboard.writeText("@" + (contact?.username || "")); toast.success("Copied!"); setShowMoreMenu(false); } },
                      { icon: "🔇", label: "Mute Notifications", onClick: () => { toast.success("Muted!"); setShowMoreMenu(false); } },
                      { icon: "🗑️", label: "Clear Chat", onClick: () => { handleClearChat(); setShowMoreMenu(false); } },
                      { icon: "🚫", label: "Block User", onClick: () => { handleBlock(); setShowMoreMenu(false); } },
                    ].map((item, i) => (
                      <button key={i} onClick={item.onClick}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0">
                        <span>{item.icon}</span>
                        <span className="text-white text-sm">{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Pinned Message */}
      {pinnedMessage && (
        <div className="flex items-center gap-3 px-4 py-2 bg-purple-900/20 border-b border-purple-500/20">
          <span className="text-purple-400 text-sm">📌</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-purple-400 font-medium">Pinned Message</p>
            <p className="text-xs text-slate-400 truncate">{pinnedMessage.content}</p>
          </div>
          <button onClick={() => setPinnedMessage(null)} className="text-slate-500 text-xs">✕</button>
        </div>
      )}

      {/* Starred Messages Panel */}
      <AnimatePresence>
        {showStarred && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="absolute inset-0 z-40 bg-[#0f0e17] flex flex-col"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#16213e]/80">
              <button onClick={() => setShowStarred(false)} className="text-slate-400 hover:text-white text-xl">←</button>
              <h2 className="text-white font-semibold">⭐ Starred Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {starredMessages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">⭐</div>
                  <p className="text-slate-500">No starred messages yet</p>
                  <p className="text-slate-600 text-sm mt-1">Long press a message and star it</p>
                </div>
              ) : (
                starredMessages.map(msg => (
                  <div key={msg._id} className="glass rounded-xl p-4 mb-3">
                    <p className="text-xs text-purple-400 mb-1">{getSenderId(msg) === user._id ? "You" : contact?.name}</p>
                    <p className="text-white text-sm">{msg.content}</p>
                    <p className="text-slate-500 text-xs mt-1">{formatTime(msg.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MESSAGES */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ background: "radial-gradient(ellipse at center, #1e1b4b10 0%, #0f0e17 100%)" }}
      >
        {loading && (
          <div className="flex justify-center py-20">
            <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="typing-dot" />)}</div>
          </div>
        )}

        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex justify-center my-4">
              <span className="px-3 py-1 glass rounded-full text-xs text-slate-500">{date}</span>
            </div>
            {msgs.map((msg) => {
              const senderId = getSenderId(msg);
              const isMine = senderId === user._id || senderId === user.id;
              const isDeleted = msg.isDeleted;
              const isStarred = starredMessages.find(m => m._id === msg._id);
              const isSearchMatch = searchResults.find(m => m._id === msg._id);
              const isCurrentMatch = searchResults[currentSearchIndex]?._id === msg._id;

              return (
                <motion.div
                  key={msg._id}
                  ref={el => searchRefs.current[msg._id] = el}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={"flex mb-2 " + (isMine ? "justify-end" : "justify-start")}
                >
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1 overflow-hidden">
                      {contact?.avatar
                        ? <img src={contact.avatar} alt="" className="w-full h-full object-cover" />
                        : contact?.name?.[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className="max-w-xs md:max-w-md lg:max-w-lg relative group">
                    {msg.replyTo && (
                      <div className={"text-xs mb-1 px-3 py-2 rounded-lg border-l-2 border-purple-500 " + (isMine ? "bg-purple-900/30" : "bg-white/5")}>
                        <p className="text-purple-400 font-medium text-xs">↩ Reply</p>
                        <p className="text-slate-400 truncate text-xs">{msg.replyTo.content || "Media"}</p>
                      </div>
                    )}

                    <div
                      onClick={(e) => { e.stopPropagation(); setSelectedMsg(selectedMsg === msg._id ? null : msg._id); }}
                      className={"px-4 py-2.5 rounded-2xl text-sm leading-relaxed cursor-pointer transition " + (
                        isCurrentMatch ? "ring-2 ring-yellow-400 " : isSearchMatch ? "ring-1 ring-yellow-400/50 " : ""
                      ) + (
                        isMine
                          ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-none"
                          : "bg-[#1e293b] text-slate-200 rounded-bl-none border border-white/8"
                      )}
                    >
                      {isDeleted ? (
                        <em className="text-slate-400 text-xs">🚫 This message was deleted</em>
                      ) : msg.type === "image" ? (
                        <img src={msg.content} alt="shared" className="max-w-full rounded-xl max-h-64 object-cover" />
                      ) : msg.type === "video" ? (
                        <video src={msg.content} controls className="max-w-full rounded-xl max-h-64" />
                      ) : msg.type === "audio" ? (
                        <audio src={msg.content} controls className="max-w-full" />
                      ) : msg.type === "file" ? (
                        <a href={msg.content} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-300 underline">
                          📎 Download File
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">
                          {searchQuery ? highlightText(msg.content, searchQuery) : msg.content}
                        </p>
                      )}

                      <div className={"flex items-center gap-1 mt-1 " + (isMine ? "justify-end" : "justify-start")}>
                        {isStarred && <span className="text-xs">⭐</span>}
                        <span className="text-xs opacity-50">{formatTime(msg.createdAt)}</span>
                        {isMine && (
                          <span className={"text-xs font-bold " + (msg.seenBy?.length > 0 ? "text-blue-400" : "text-white/50")}>
                            {msg.isSending ? "⏳" : msg.seenBy?.length > 0 ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Message Action Menu */}
                    <AnimatePresence>
                      {selectedMsg === msg._id && !isDeleted && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={"absolute z-30 w-48 bg-[#16213e] rounded-2xl overflow-hidden shadow-2xl border border-white/10 " + (isMine ? "right-0" : "left-0") + " top-0"}
                          onClick={e => e.stopPropagation()}
                        >
                          {[
                            { icon: "↩", label: "Reply", onClick: () => { setReplyTo(msg); inputRef.current?.focus(); setSelectedMsg(null); } },
                            { icon: "⭐", label: isStarred ? "Unstar" : "Star", onClick: () => starMessage(msg) },
                            { icon: "📌", label: pinnedMessage?._id === msg._id ? "Unpin" : "Pin", onClick: () => pinMessage(msg) },
                            { icon: "📤", label: "Forward", onClick: () => forwardMessage(msg) },
                            { icon: "📋", label: "Copy", onClick: () => { navigator.clipboard.writeText(msg.content); toast.success("Copied!"); setSelectedMsg(null); } },
                            ...(isMine ? [{ icon: "🗑️", label: "Delete", onClick: () => deleteMessage(msg._id), red: true }] : []),
                          ].map((action, i) => (
                            <button key={i} onClick={action.onClick}
                              className={"flex items-center gap-3 w-full px-4 py-2.5 hover:bg-white/5 transition border-b border-white/5 last:border-0 " + (action.red ? "text-red-400" : "text-white")}>
                              <span className="text-sm">{action.icon}</span>
                              <span className="text-sm">{action.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {msg.reactions?.length > 0 && (
                      <div className={"flex gap-1 mt-1 flex-wrap " + (isMine ? "justify-end" : "justify-start")}>
                        {Object.entries(
                          msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})
                        ).map(([emoji, count]) => (
                          <span key={emoji}
                            className="text-xs glass px-2 py-0.5 rounded-full cursor-pointer hover:bg-white/10"
                            onClick={() => reactToMessage(msg._id, emoji)}>
                            {emoji} {count > 1 ? count : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    {!isDeleted && !selectedMsg && (
                      <div className={"absolute top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition " + (isMine ? "-left-20" : "-right-20")}>
                        <button onClick={(e) => { e.stopPropagation(); setShowReaction(showReaction === msg._id ? null : msg._id); }}
                          className="w-7 h-7 glass rounded-full flex items-center justify-center text-xs hover:bg-white/10">😊</button>
                        <button onClick={(e) => { e.stopPropagation(); setReplyTo(msg); inputRef.current?.focus(); }}
                          className="w-7 h-7 glass rounded-full flex items-center justify-center text-xs hover:bg-white/10">↩</button>
                      </div>
                    )}

                    {showReaction === msg._id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={"absolute z-20 flex gap-1 glass rounded-2xl p-2 shadow-xl " + (isMine ? "right-0" : "left-0") + " -top-12"}
                        onClick={e => e.stopPropagation()}
                      >
                        {EMOJIS.map(emoji => (
                          <button key={emoji} onClick={() => reactToMessage(msg._id, emoji)}
                            className="text-lg hover:scale-125 transition">{emoji}</button>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {isMine && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white text-xs font-bold ml-2 flex-shrink-0 mt-1 overflow-hidden">
                      {user?.avatar
                        ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        : user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold mr-2 overflow-hidden">
              {contact?.avatar ? <img src={contact.avatar} alt="" className="w-full h-full object-cover" /> : contact?.name?.[0]?.toUpperCase()}
            </div>
            <div className="px-4 py-3 bg-[#1e293b] rounded-2xl rounded-bl-none border border-white/8 flex gap-1.5 items-center">
              {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: i * 0.2 + "s" }} />)}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Replies */}
      {smartReplies.length > 0 && !showSearch && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto border-t border-white/3">
          {smartReplies.map((reply, i) => (
            <button key={i} onClick={() => { sendMessage(reply); setSmartReplies([]); }}
              className="flex-shrink-0 px-3 py-1.5 glass rounded-full text-sm text-slate-300 hover:text-white hover:bg-white/10 transition">
              {reply}
            </button>
          ))}
          <button onClick={() => setSmartReplies([])} className="flex-shrink-0 text-slate-600 text-xs px-2">✕</button>
        </div>
      )}

      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="flex items-center gap-3 px-4 py-2 bg-purple-900/20 border-t border-purple-500/20">
            <div className="flex-1 border-l-2 border-purple-500 pl-3">
              <p className="text-xs text-purple-400 font-medium">↩ Replying to {replyTo.sender?.name || "message"}</p>
              <p className="text-xs text-slate-400 truncate">{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-white text-sm w-6">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 py-3 glass border-t border-white/5">
            <div className="flex flex-wrap gap-2">
              {QUICK_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => setInput(p => p + emoji)} className="text-2xl hover:scale-125 transition">{emoji}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Menu */}
      <AnimatePresence>
        {showAttach && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 py-3 glass border-t border-white/5">
            <div className="flex gap-3">
              {[
                { icon: "🖼️", label: "Image", accept: "image/*" },
                { icon: "🎵", label: "Audio", accept: "audio/*" },
                { icon: "📹", label: "Video", accept: "video/*" },
                { icon: "📄", label: "File", accept: "*/*" },
              ].map(item => (
                <button key={item.label}
                  onClick={() => { fileRef.current.accept = item.accept; fileRef.current.click(); setShowAttach(false); }}
                  className="flex flex-col items-center gap-1 px-4 py-3 glass rounded-xl hover:bg-white/10 transition">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs text-slate-400">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INPUT BAR */}
      {!showSearch && (
        <div className="flex items-end gap-2 px-4 py-3 border-t border-white/5 bg-[#16213e]/80 backdrop-blur">
          <button
            onClick={(e) => { e.stopPropagation(); setShowAttach(p => !p); setShowEmoji(false); }}
            className={"w-10 h-10 rounded-xl flex items-center justify-center transition flex-shrink-0 mb-0.5 " + (showAttach ? "bg-purple-600 text-white" : "glass text-slate-400 hover:text-purple-400")}
          >📎</button>
          <div className="flex-1 flex items-end bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-purple-500/50 transition">
            <textarea
              ref={inputRef} value={input}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploading ? "Uploading..." : "Type a message..."}
              disabled={uploading} rows={1}
              className="flex-1 px-4 py-3 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none resize-none max-h-32"
              style={{ lineHeight: "1.5" }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setShowEmoji(p => !p); setShowAttach(false); }}
              className={"p-3 transition flex-shrink-0 " + (showEmoji ? "text-yellow-400" : "text-slate-400 hover:text-yellow-400")}
            >😊</button>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendMessage()} disabled={uploading}
            className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-purple-500/30 hover:from-purple-500 transition disabled:opacity-60">
            {uploading ? "⏳" : "➤"}
          </motion.button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
        </div>
      )}

      {/* CALL MODAL */}
      <AnimatePresence>
        {showCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: showCallModal === "video" ? "linear-gradient(135deg, #0f0e17, #1e1b4b)" : "linear-gradient(135deg, #0f0e17, #16213e)" }}
          >
            {showCallModal === "video" && callActive && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-cyan-900/20 flex items-center justify-center">
                <div className="text-9xl opacity-10">📹</div>
              </div>
            )}
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 text-center px-8">
              <div className={"mx-auto mb-6 rounded-full overflow-hidden flex items-center justify-center text-white font-bold bg-gradient-to-br from-purple-500 to-cyan-500 " + (callActive ? "w-32 h-32 text-5xl" : "w-28 h-28 text-4xl")}>
                {contact?.avatar
                  ? <img src={contact.avatar} alt="" className="w-full h-full object-cover" />
                  : contact?.name?.[0]?.toUpperCase()}
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">{contact?.name}</h2>
              {!callActive
                ? <p className="text-slate-400 animate-pulse mb-2">{showCallModal === "voice" ? "📞 Calling..." : "📹 Video calling..."}</p>
                : <p className="text-green-400 font-mono text-lg mb-2">{formatCallTime(callDuration)}</p>
              }
              <p className="text-slate-500 text-sm mb-10">{callActive ? "Connected" : "Waiting for answer..."}</p>
              <div className="flex justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <button onClick={() => toast.success("Microphone toggled")}
                    className="w-14 h-14 glass rounded-full flex items-center justify-center text-2xl hover:bg-white/10 transition border border-white/10">🎤</button>
                  <span className="text-slate-500 text-xs">Mute</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button onClick={endCall}
                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-2xl hover:bg-red-600 transition shadow-lg shadow-red-500/40">📵</button>
                  <span className="text-slate-400 text-xs">End</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button onClick={() => toast.success(showCallModal === "video" ? "Camera toggled" : "Speaker toggled")}
                    className="w-14 h-14 glass rounded-full flex items-center justify-center text-2xl hover:bg-white/10 transition border border-white/10">
                    {showCallModal === "video" ? "📷" : "🔊"}
                  </button>
                  <span className="text-slate-500 text-xs">{showCallModal === "video" ? "Camera" : "Speaker"}</span>
                </div>
              </div>
            </motion.div>
            {showCallModal === "video" && (
              <div className="absolute bottom-8 right-8 w-28 h-40 bg-[#16213e] rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-bold mx-auto mb-1 overflow-hidden">
                    {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-slate-500 text-xs">You</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}