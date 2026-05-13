import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";

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

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

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
      if ((msg.sender._id === userId || msg.sender === userId) ||
        (msg.receiver === user._id || msg.receiver?._id === user._id)) {
        setMessages(p => [...p, msg]);
        setTimeout(scrollToBottom, 50);
        emit("seen", { messageId: msg._id, senderId: msg.sender._id || msg.sender });
      }
    });
    const offTyping = on("typing", ({ userId: tid }) => { if (tid === userId) setIsTyping(true); });
    const offStop = on("stop_typing", ({ userId: tid }) => { if (tid === userId) setIsTyping(false); });
    const offSeen = on("message_seen", ({ messageId }) => {
      setMessages(p => p.map(m => m._id === messageId ? { ...m, seenBy: [...(m.seenBy || []), userId] } : m));
    });
    return () => { offMsg(); offTyping(); offStop(); offSeen(); };
  }, [userId, user._id, emit, on]);

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
      setMessages(p => p.map(m => m._id === msgId ? { ...m, isDeleted: true, content: "This message was deleted" } : m));
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

  const grouped = messages.reduce((acc, msg) => {
    const date = formatDate(msg.createdAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  const isOnline = onlineUsers.has(userId) || contact?.isOnline;

  return (
    <div className="flex h-screen bg-[#0f0e17] overflow-hidden flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#16213e]/80 backdrop-blur">
        <button onClick={() => navigate("/home")} className="text-slate-400 hover:text-white transition text-xl w-8">←</button>
        <div className="relative cursor-pointer" onClick={() => navigate("/profile")}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold overflow-hidden">
            {contact?.avatar ? <img src={contact.avatar} alt="" className="w-full h-full object-cover" /> : contact?.name?.[0]?.toUpperCase()}
          </div>
          {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#16213e]" />}
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">{contact?.name || "..."}</p>
          <p className="text-xs text-slate-500">
            {isTyping ? <span className="text-purple-400 animate-pulse">typing...</span> :
             isOnline ? <span className="text-green-400">Online</span> : "Offline"}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-green-400 transition">📞</button>
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-cyan-400 transition">📹</button>
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition">⋮</button>
        </div>
      </div>

      {/* MESSAGES */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ background: "radial-gradient(ellipse at center, #1e1b4b10 0%, #0f0e17 100%)" }}
        onClick={() => { setSelectedMsg(null); setShowEmoji(false); setShowAttach(false); }}
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
              const isMine = (msg.sender._id || msg.sender) === user._id;
              const isDeleted = msg.isDeleted;
              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={"flex mb-2 " + (isMine ? "justify-end" : "justify-start")}
                >
                  {/* Avatar for receiver */}
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                      {contact?.name?.[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className="max-w-xs md:max-w-md lg:max-w-lg relative group">
                    {/* Reply preview */}
                    {msg.replyTo && (
                      <div className={"text-xs mb-1 px-3 py-2 rounded-lg border-l-2 border-purple-500 " + (isMine ? "bg-purple-900/30" : "bg-white/5")}>
                        <p className="text-purple-400 font-medium text-xs">↩ Reply</p>
                        <p className="text-slate-400 truncate text-xs">{msg.replyTo.content || "Media"}</p>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      onClick={(e) => { e.stopPropagation(); setSelectedMsg(selectedMsg === msg._id ? null : msg._id); }}
                      className={"px-4 py-2.5 rounded-2xl text-sm leading-relaxed cursor-pointer " + (
                        isMine
                          ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-sm"
                          : "bg-white/8 text-slate-200 rounded-bl-sm border border-white/5"
                      )}
                    >
                      {/* Message content based on type */}
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
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}

                      {/* Time and status */}
                      <div className={"flex items-center gap-1 mt-1 " + (isMine ? "justify-end" : "justify-start")}>
                        <span className="text-xs opacity-50">{formatTime(msg.createdAt)}</span>
                        {isMine && (
                          <span className={"text-xs " + (msg.seenBy?.length > 0 ? "text-blue-300" : "opacity-50")}>
                            {msg.isSending ? "⏳" : msg.seenBy?.length > 0 ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reactions display */}
                    {msg.reactions?.length > 0 && (
                      <div className={"flex gap-1 mt-1 flex-wrap " + (isMine ? "justify-end" : "justify-start")}>
                        {Object.entries(
                          msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})
                        ).map(([emoji, count]) => (
                          <span key={emoji} className="text-xs glass px-2 py-0.5 rounded-full cursor-pointer hover:bg-white/10"
                            onClick={() => reactToMessage(msg._id, emoji)}>
                            {emoji} {count > 1 ? count : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action buttons on hover */}
                    {!isDeleted && (
                      <div className={"absolute top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition " + (isMine ? "-left-20" : "-right-20")}>
                        <button onClick={(e) => { e.stopPropagation(); setShowReaction(showReaction === msg._id ? null : msg._id); }}
                          className="w-7 h-7 glass rounded-full flex items-center justify-center text-xs hover:bg-white/10">
                          😊
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setReplyTo(msg); inputRef.current?.focus(); }}
                          className="w-7 h-7 glass rounded-full flex items-center justify-center text-xs hover:bg-white/10">
                          ↩
                        </button>
                        {isMine && (
                          <button onClick={(e) => { e.stopPropagation(); deleteMessage(msg._id); }}
                            className="w-7 h-7 glass rounded-full flex items-center justify-center text-xs hover:bg-red-500/20 text-red-400">
                            🗑
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reaction picker */}
                    {showReaction === msg._id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={"absolute z-20 flex gap-1 glass rounded-2xl p-2 shadow-xl " + (isMine ? "right-0" : "left-0") + " -top-12"}
                        onClick={e => e.stopPropagation()}
                      >
                        {EMOJIS.map(emoji => (
                          <button key={emoji} onClick={() => reactToMessage(msg._id, emoji)}
                            className="text-lg hover:scale-125 transition">
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold mr-2">
              {contact?.name?.[0]?.toUpperCase()}
            </div>
            <div className="px-4 py-3 bg-white/8 rounded-2xl rounded-bl-sm border border-white/5 flex gap-1.5 items-center">
              {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: i * 0.2 + "s" }} />)}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Replies */}
      {smartReplies.length > 0 && (
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
                <button key={emoji} onClick={() => setInput(p => p + emoji)}
                  className="text-2xl hover:scale-125 transition">
                  {emoji}
                </button>
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
      <div className="flex items-end gap-2 px-4 py-3 border-t border-white/5 bg-[#16213e]/80 backdrop-blur">
        {/* Attachment button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowAttach(p => !p); setShowEmoji(false); }}
          className={"w-10 h-10 rounded-xl flex items-center justify-center transition flex-shrink-0 mb-0.5 " + (showAttach ? "bg-purple-600 text-white" : "glass text-slate-400 hover:text-purple-400")}
        >
          📎
        </button>

        {/* Text input */}
        <div className="flex-1 flex items-end bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-purple-500/50 transition">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={uploading ? "Uploading..." : "Type a message..."}
            disabled={uploading}
            rows={1}
            className="flex-1 px-4 py-3 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none resize-none max-h-32"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setShowEmoji(p => !p); setShowAttach(false); }}
            className={"p-3 transition flex-shrink-0 " + (showEmoji ? "text-yellow-400" : "text-slate-400 hover:text-yellow-400")}
          >
            😊
          </button>
        </div>

        {/* Send button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => sendMessage()}
          disabled={uploading}
          className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-purple-500/30 hover:from-purple-500 transition disabled:opacity-60"
        >
          {uploading ? "⏳" : "➤"}
        </motion.button>

        {/* Hidden file input */}
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
      </div>
    </div>
  );
}