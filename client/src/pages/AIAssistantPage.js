import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { format } from "date-fns";

export default function AIAssistantPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I am ConnectX AI. I can help you draft messages, translate text, summarize conversations, or just chat. What can I do for you today? I support English, Hindi, and Telugu!", time: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input, time: new Date() };
    const history = messages.filter(m => m.role !== "system").slice(-10).map(({ role, content }) => ({ role, content }));
    setMessages(p => [...p, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/chat", { message: input, history });
      setMessages(p => [...p, { role: "assistant", content: data.reply, time: new Date() }]);
    } catch(e) {
      setMessages(p => [...p, { role: "assistant", content: "Sorry, I encountered an error. Please try again.", time: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "Draft a message", prompt: "Help me write a professional message to my colleague" },
    { label: "Translate text", prompt: "Translate Hello, how are you? to Telugu" },
    { label: "Summarize", prompt: "Summarize this in 3 bullet points:" },
    { label: "Smart reply", prompt: "Suggest 3 smart replies for: Are you free tomorrow?" },
  ];

  return (
    <div className="flex h-screen bg-[#0f0e17] flex-col">
      <div className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5 glass">
        <button onClick={() => navigate("/home")} className="text-slate-400 hover:text-white transition text-xl">
          Back
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-xl">
          AI
        </div>
        <div>
          <p className="text-white font-semibold">ConnectX AI</p>
          <p className="text-xs text-green-400">Always available</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={"max-w-2xl " + (msg.role === "user" ? "" : "w-full")}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-xs">
                    AI
                  </div>
                  <span className="text-xs text-slate-500">ConnectX AI</span>
                </div>
              )}
              <div className={"px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap " + (
                msg.role === "user"
                  ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-sm"
                  : "glass text-slate-200 rounded-bl-sm"
              )}>
                {msg.content}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="typing-dot" style={{ animationDelay: i * 0.2 + "s" }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 2 && (
        <div className="grid grid-cols-2 gap-2 px-4 pb-2">
          {quickActions.map(a => (
            <button key={a.label} onClick={() => setInput(a.prompt)}
              className="px-3 py-2.5 glass rounded-xl text-left text-sm text-slate-400 hover:text-white hover:bg-white/8 transition">
              {a.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 px-4 py-3 border-t border-white/5 glass">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask AI anything..."
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={send}
          disabled={loading}
          className="px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-xl disabled:opacity-60 transition shadow-lg shadow-purple-500/25">
          Send
        </motion.button>
      </div>
    </div>
  );
}