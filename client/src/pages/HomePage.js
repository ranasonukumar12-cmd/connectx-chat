import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import toast from "react-hot-toast";

export default function HomePage() {
  const { user, logout } = useAuth();
  const { isConnected, onlineUsers } = useSocket();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Chats");
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get("/users/me").then(({ data }) => {
      setContacts(data.user?.contacts || []);
    }).catch(() => {});
    api.get("/groups").then(({ data }) => {
      setGroups(data.groups || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get("/users/search?q=" + encodeURIComponent(search));
        setSearchResults(data.users || []);
      } catch(e) {} finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const createGroup = async () => {
    if (!groupName.trim()) return toast.error("Enter group name!");
    setCreating(true);
    try {
      const { data } = await api.post("/groups/create", {
        name: groupName,
        description: groupDesc,
        members: selectedMembers,
      });
      setGroups(p => [data.group, ...p]);
      setShowCreateGroup(false);
      setGroupName("");
      setGroupDesc("");
      setSelectedMembers([]);
      toast.success("Group created!");
      navigate("/group/" + data.group._id);
    } catch(e) {
      toast.error("Failed to create group");
    } finally { setCreating(false); }
  };

  const toggleMember = (userId) => {
    setSelectedMembers(p =>
      p.includes(userId) ? p.filter(id => id !== userId) : [...p, userId]
    );
  };

  const displayList = search ? searchResults : contacts;

  return (
    <div className="flex h-screen bg-[#0f0e17] overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-80 flex flex-col border-r border-white/5 bg-[#16213e]/60 backdrop-blur">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/profile")}>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold overflow-hidden">
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : user?.name?.[0]?.toUpperCase()}
              </div>
              <div className={"absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#16213e] " + (isConnected ? "bg-green-400" : "bg-slate-500")} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{user?.name}</p>
              <p className="text-xs text-slate-500">{isConnected ? "● Online" : "Connecting..."}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => navigate("/ai")} className="w-8 h-8 glass rounded-lg flex items-center justify-center text-slate-400 hover:text-purple-400 transition">🤖</button>
            <button onClick={() => navigate("/settings")} className="w-8 h-8 glass rounded-lg flex items-center justify-center text-slate-400 hover:text-purple-400 transition">⚙️</button>
            <button onClick={logout} className="w-8 h-8 glass rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 transition">🚪</button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-1 mb-2">
          {["Chats", "Groups", "Stories", "Calls"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={"flex-1 py-1.5 rounded-lg text-xs font-medium transition " + (tab === t ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-300")}>
              {t}
            </button>
          ))}
        </div>

        {/* Create Group Button */}
        {tab === "Groups" && (
          <div className="px-4 mb-2">
            <button onClick={() => setShowCreateGroup(true)}
              className="w-full py-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400 text-sm font-medium hover:bg-purple-600/30 transition flex items-center justify-center gap-2">
              ➕ Create New Group
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {tab === "Chats" && (
            <>
              {searching && (
                <div className="flex justify-center py-8">
                  <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="typing-dot" />)}</div>
                </div>
              )}
              {displayList.length === 0 && !searching && (
                <div className="text-center py-12 px-4">
                  <div className="text-5xl mb-3">{search ? "🔍" : "💬"}</div>
                  <p className="text-slate-500 text-sm">{search ? "No users found" : "Search users to chat"}</p>
                </div>
              )}
              {displayList.map((contact, i) => (
                <motion.div key={contact._id || i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate("/chat/" + contact._id)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/4 cursor-pointer transition border-b border-white/3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/70 to-cyan-500/70 flex items-center justify-center text-white font-semibold overflow-hidden">
                      {contact.avatar
                        ? <img src={contact.avatar} alt="" className="w-full h-full object-cover" />
                        : contact.name?.[0]?.toUpperCase()}
                    </div>
                    {(onlineUsers.has(contact._id) || contact.isOnline) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#16213e]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{contact.name}</p>
                    <p className="text-xs text-slate-500 truncate">{contact.bio || "Hey there! I am using ConnectX"}</p>
                  </div>
                </motion.div>
              ))}
            </>
          )}

          {tab === "Groups" && (
            <>
              {groups.length === 0 && (
                <div className="text-center py-12 px-4">
                  <div className="text-5xl mb-3">👥</div>
                  <p className="text-slate-500 text-sm">No groups yet</p>
                  <p className="text-slate-600 text-xs mt-1">Create a group to get started</p>
                </div>
              )}
              {groups.map((group, i) => (
                <motion.div key={group._id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate("/group/" + group._id)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/4 cursor-pointer transition border-b border-white/3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                    {group.avatar ? <img src={group.avatar} alt="" className="w-full h-full object-cover" /> : group.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{group.name}</p>
                    <p className="text-xs text-slate-500">{group.members?.length || 0} members</p>
                  </div>
                </motion.div>
              ))}
            </>
          )}

          {tab === "Stories" && (
            <div className="text-center py-12 px-4">
              <div className="text-5xl mb-3">⚡</div>
              <p className="text-slate-500 text-sm">Stories coming soon!</p>
            </div>
          )}

          {tab === "Calls" && (
            <div className="text-center py-12 px-4">
              <div className="text-5xl mb-3">📞</div>
              <p className="text-slate-500 text-sm">Calls coming soon!</p>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex items-center justify-center bg-[#0f0e17] relative">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center relative z-10 px-8">
          <div className="text-7xl mb-6">💬</div>
          <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "Syne" }}>ConnectX Chat</h2>
          <p className="text-slate-500 mb-8">Select a conversation to start messaging</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate("/ai")} className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/8 transition">
              🤖 AI Assistant
            </button>
            <button onClick={() => navigate("/profile")} className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/8 transition">
              👤 My Profile
            </button>
            <button onClick={() => navigate("/settings")} className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/8 transition">
              ⚙️ Settings
            </button>
          </div>
        </motion.div>
      </main>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateGroup(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#16213e] rounded-2xl p-6 w-full max-w-md border border-white/10"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-bold text-lg mb-4">➕ Create New Group</h3>
              <div className="space-y-3 mb-4">
                <input value={groupName} onChange={e => setGroupName(e.target.value)}
                  placeholder="Group name *"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition text-sm" />
                <input value={groupDesc} onChange={e => setGroupDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition text-sm" />
              </div>
              <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Add Members</p>
              <div className="max-h-40 overflow-y-auto space-y-1 mb-4">
                {contacts.length === 0 && (
                  <p className="text-slate-600 text-sm text-center py-4">No contacts found. Search users first.</p>
                )}
                {contacts.map(c => (
                  <div key={c._id} onClick={() => toggleMember(c._id)}
                    className={"flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition " + (selectedMembers.includes(c._id) ? "bg-purple-600/20 border border-purple-500/30" : "hover:bg-white/5")}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {c.avatar ? <img src={c.avatar} alt="" className="w-full h-full object-cover" /> : c.name?.[0]?.toUpperCase()}
                    </div>
                    <p className="text-white text-sm flex-1">{c.name}</p>
                    {selectedMembers.includes(c._id) && <span className="text-purple-400">✓</span>}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreateGroup(false)}
                  className="flex-1 py-3 glass text-slate-400 rounded-xl hover:text-white transition text-sm">
                  Cancel
                </button>
                <button onClick={createGroup} disabled={creating}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl disabled:opacity-60 transition text-sm font-semibold">
                  {creating ? "Creating..." : "Create Group"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}