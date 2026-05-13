import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import toast from "react-hot-toast";

const formatTime = (date) => format(new Date(date), "h:mm a");

export default function GroupPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const { emit, on } = useSocket();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [isTyping, setIsTyping] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    Promise.all([
      api.get("/groups/" + groupId),
      api.get("/groups/" + groupId + "/messages"),
    ]).then(([{ data: gd }, { data: md }]) => {
      setGroup(gd.group);
      setMessages(md.messages || []);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
      emit("join_group", groupId);
    }).catch(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    const offMsg = on("receive_message", (msg) => {
      if (msg.group === groupId || msg.group?._id === groupId) {
        setMessages(p => [...p, msg]);
        setTimeout(scrollToBottom, 50);
      }
    });
    const offTyping = on("typing", ({ userId: tid, name }) => {
      setIsTyping(p => [...new Set([...p, name])]);
    });
    const offStop = on("stop_typing", ({ userId: tid }) => {
      setIsTyping([]);
    });
    return () => { offMsg(); offTyping(); offStop(); };
  }, [groupId, on]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const tempId = Date.now().toString();
    const tempMsg = {
      _id: tempId, content: input, type: "text",
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      group: groupId, createdAt: new Date().toISOString(),
      isSending: true,
    };
    setMessages(p => [...p, tempMsg]);
    emit("send_message", { groupId, content: input, type: "text", tempId });
    setInput("");
    setTimeout(scrollToBottom, 50);
  };

  const handleTyping = (val) => {
    setInput(val);
    emit("typing", { groupId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emit("stop_typing", { groupId }), 1500);
  };

  const leaveGroup = async () => {
    try {
      await api.post("/groups/" + groupId + "/leave");
      toast.success("Left group successfully");
      navigate("/home");
    } catch(e) {
      toast.error("Failed to leave group");
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0f0e17]">
      <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="typing-dot" />)}</div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0f0e17] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#16213e]/80 backdrop-blur">
        <button onClick={() => navigate("/home")} className="text-slate-400 hover:text-white text-xl w-8">←</button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden cursor-pointer"
          onClick={() => setShowMembers(p => !p)}>
          {group?.avatar ? <img src={group.avatar} alt="" className="w-full h-full object-cover" /> : group?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 cursor-pointer" onClick={() => setShowMembers(p => !p)}>
          <p className="text-white font-semibold text-sm">{group?.name}</p>
          <p className="text-xs text-slate-500">
            {isTyping.length > 0 ? <span className="text-purple-400">{isTyping[0]} is typing...</span> :
             `${group?.members?.length || 0} members`}
          </p>
        </div>
        <button onClick={leaveGroup} className="w-9 h-9 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 transition" title="Leave Group">🚪</button>
      </div>

      {/* Members Panel */}
      {showMembers && (
        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }}
          className="bg-[#16213e]/60 border-b border-white/5 px-4 py-3 overflow-hidden">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Members ({group?.members?.length})</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {group?.members?.map(m => (
              <div key={m.user._id} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold overflow-hidden">
                  {m.user.avatar ? <img src={m.user.avatar} alt="" className="w-full h-full object-cover" /> : m.user.name?.[0]?.toUpperCase()}
                </div>
                <p className="text-xs text-slate-400 truncate w-12 text-center">{m.user.name?.split(" ")[0]}</p>
                {m.role === "owner" && <span className="text-xs text-purple-400">👑</span>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg) => {
          const isMine = (msg.sender._id || msg.sender) === user._id;
          return (
            <motion.div key={msg._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className={"flex mb-3 " + (isMine ? "justify-end" : "justify-start")}>
              {!isMine && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1 overflow-hidden">
                  {msg.sender.avatar ? <img src={msg.sender.avatar} alt="" className="w-full h-full object-cover" /> : msg.sender.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="max-w-xs md:max-w-md">
                {!isMine && <p className="text-xs text-purple-400 mb-1 font-medium">{msg.sender.name}</p>}
                <div className={"px-4 py-2.5 rounded-2xl text-sm " + (
                  isMine
                    ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-sm"
                    : "bg-white/8 text-slate-200 rounded-bl-sm border border-white/5"
                )}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className={"flex items-center gap-1 mt-1 " + (isMine ? "justify-end" : "justify-start")}>
                    <span className="text-xs opacity-50">{formatTime(msg.createdAt)}</span>
                    {isMine && <span className="text-xs opacity-50">{msg.isSending ? "⏳" : "✓✓"}</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {isTyping.length > 0 && (
          <div className="flex justify-start mb-2">
            <div className="px-4 py-3 bg-white/8 rounded-2xl rounded-bl-sm border border-white/5 flex gap-1.5">
              {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: i*0.2+"s" }} />)}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-white/5 bg-[#16213e]/80 backdrop-blur">
        <div className="flex-1 flex items-end bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-purple-500/50 transition">
          <textarea
            value={input}
            onChange={e => handleTyping(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Message group..."
            rows={1}
            className="flex-1 px-4 py-3 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none resize-none max-h-32"
          />
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={sendMessage}
          className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
          ➤
        </motion.button>
      </div>
    </div>
  );
}