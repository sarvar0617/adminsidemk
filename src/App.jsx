import { useEffect, useState } from "react";
import api from "./api/api.js";

function App() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    listening: "",
    reading: "",
    speaking: "",
    writing: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ TIMER STATES
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timeInput, setTimeInput] = useState({
    days: "",
    hours: "",
    minutes: "",
  });

  // 🔄 FETCH USERS
  const fetchUsers = async () => {
    try {
      const res = await api.get("/");
      setUsers(res.data);
    } catch (err) {
      console.error("API xatolik:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ TIMER LOAD (refreshdan keyin ham ishlasin)
  useEffect(() => {
    const savedTimer = localStorage.getItem("timer");
    if (savedTimer) {
      const parsed = Number(savedTimer);
      if (parsed > Date.now()) {
        setTimer(parsed);
        setTimeLeft(parsed - Date.now());
      }
    }
  }, []);

  // ✅ TIMER EFFECT (ENG MUHIM QISM)
  useEffect(() => {
    if (!timer) return;

    const interval = setInterval(async () => {
      const remaining = timer - Date.now();

      if (remaining <= 0) {
        clearInterval(interval);
        setTimer(null);
        setTimeLeft(null);
        localStorage.removeItem("timer");

        try {
          const res = await api.get("/");
          const latestUsers = res.data;

          console.log("Timer ended — resetting scores...");

          await Promise.allSettled(
            latestUsers.map((u) =>
              api.put(`/${u.id}`, {
                ...u,
                listening: 0,
                reading: 0,
                speaking: 0,
                writing: 0,
              })
            )
          );

          fetchUsers();
        } catch (err) {
          console.error("Reset error:", err);
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // 🔤 INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ⏱ TIMER INPUT
  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setTimeInput((prev) => ({ ...prev, [name]: value }));
  };

  // 💾 SAVE USER
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    const { listening, reading, speaking, writing } = formData;
    const scores = [
      Number(listening),
      Number(reading),
      Number(speaking),
      Number(writing),
    ];

    if (scores.some((s) => s < 0 || s > 75)) {
      alert("⚠️ Ballar 0–75 oralig‘ida bo‘lishi kerak!");
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/${editId}`, formData);
      } else {
        await api.post("/", formData);
      }

      setFormData({
        name: "",
        listening: "",
        reading: "",
        speaking: "",
        writing: "",
      });

      setIsEditing(false);
      setModalOpen(false); // Modalni yopish
      fetchUsers();
    } catch (err) {
      console.error("Saqlashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  // ❌ DELETE
  const handleDelete = async (id) => {
    if (confirm("Rostdan o‘chirmoqchimisiz?")) {
      await api.delete(`/${id}`);
      fetchUsers();
    }
  };
  // 🔄 RESET ALL SCORES
  const handleResetAllScores = async () => {
    if (confirm("Barcha o'quvchilarning ballarini 0 ga tenglab qo'yishni xohlaysizmi? Isimlar saqlanadi.")) {
      try {
        setLoading(true);
        await Promise.allSettled(
          users.map((u) =>
            api.put(`/${u.id}`, {
              ...u,
              listening: 0,
              reading: 0,
              speaking: 0,
              writing: 0,
            })
          )
        );
        fetchUsers();
        alert("✅ Barcha ballar 0 ga tenglab qo'yildi!");
      } catch (err) {
        console.error("Reset xatolik:", err);
        alert("❌ Ballarni qayta tiklashda xatolik!");
      } finally {
        setLoading(false);
      }
    }
  };
  // ✏️ EDIT
  const handleEdit = (user) => {
    setIsEditing(true);
    setEditId(user.id);
    setFormData({
      name: user.name,
      listening: user.listening,
      reading: user.reading,
      speaking: user.speaking,
      writing: user.writing,
    });
    setModalOpen(true); // Modalni ochish
  };

  // ▶️ START TIMER
  const startTimer = () => {
    const days = Number(timeInput.days) || 0;
    const hours = Number(timeInput.hours) || 0;
    const minutes = Number(timeInput.minutes) || 0;

    const totalMs =
      days * 24 * 60 * 60 * 1000 +
      hours * 60 * 60 * 1000 +
      minutes * 60 * 1000;

    if (totalMs <= 0) {
      alert("Vaqt kiriting!");
      return;
    }

    const endTime = Date.now() + totalMs;

    setTimer(endTime);
    setTimeLeft(totalMs);
    localStorage.setItem("timer", endTime);
  };

  // ⛔ STOP TIMER
  const stopTimer = () => {
    setTimer(null);
    setTimeLeft(null);
    localStorage.removeItem("timer");
  };

  // ⏳ FORMAT TIME
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);

    const d = Math.floor(totalSeconds / (24 * 3600));
    const h = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-900 to-violet-800 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-violet-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            📊 IELTS Admin Panel
          </h1>
          <p className="text-white/60 text-lg">Manage student IELTS scores</p>
        </div>

        {/* SEARCH + ADD + RESET */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
          <div className="flex-1">
            <input
              placeholder="🔍 Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-violet-400 focus:bg-white/15 focus:outline-none transition text-white placeholder-white/50"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: "",
                  listening: "",
                  reading: "",
                  speaking: "",
                  writing: "",
                });
                setModalOpen(true);
              }}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 px-6 py-3 rounded-xl font-semibold transition transform hover:scale-105 whitespace-nowrap shadow-lg"
            >
              ➕ Add Student
            </button>

            <button
              onClick={handleResetAllScores}
              disabled={loading || users.length === 0}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition transform hover:scale-105 whitespace-nowrap shadow-lg"
            >
              🔄 Reset Scores
            </button>
          </div>
        </div>

        {/* STUDENTS COUNT */}
        <div className="mb-6 text-white/70">
          <p className="text-sm">Showing <span className="text-violet-300 font-semibold">{filteredUsers.length}</span> students</p>
        </div>

        {/* ADD/EDIT FORM MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-violet-300">
                {isEditing ? "✏️ Edit Student" : "➕ Add New Student"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-white/80 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter student name"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-400 focus:bg-white/15 focus:outline-none transition text-white placeholder-white/40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Listening</label>
                    <input
                      type="number"
                      name="listening"
                      value={formData.listening}
                      onChange={handleChange}
                      placeholder="0-9"
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-400 focus:bg-white/15 focus:outline-none transition text-white placeholder-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Reading</label>
                    <input
                      type="number"
                      name="reading"
                      value={formData.reading}
                      onChange={handleChange}
                      placeholder="0-9"
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-400 focus:bg-white/15 focus:outline-none transition text-white placeholder-white/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Speaking</label>
                    <input
                      type="number"
                      name="speaking"
                      value={formData.speaking}
                      onChange={handleChange}
                      placeholder="0-9"
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-400 focus:bg-white/15 focus:outline-none transition text-white placeholder-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Writing</label>
                    <input
                      type="number"
                      name="writing"
                      value={formData.writing}
                      onChange={handleChange}
                      placeholder="0-9"
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-400 focus:bg-white/15 focus:outline-none transition text-white placeholder-white/40"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-lg font-semibold transition transform hover:scale-105"
                  >
                    {isEditing ? "💾 Update" : "➕ Add Student"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg font-semibold transition border border-white/20"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STUDENTS TABLE/CARDS */}
        {filteredUsers.length > 0 ? (
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20 bg-white/5">
                    <th className="px-6 py-4 text-white/80 font-semibold">Name</th>
                    <th className="px-6 py-4 text-white/80 font-semibold text-center">Listening</th>
                    <th className="px-6 py-4 text-white/80 font-semibold text-center">Reading</th>
                    <th className="px-6 py-4 text-white/80 font-semibold text-center">Speaking</th>
                    <th className="px-6 py-4 text-white/80 font-semibold text-center">Writing</th>
                    <th className="px-6 py-4 text-white/80 font-semibold text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => (
                    <tr 
                      key={u.id} 
                      className="border-b border-white/10 hover:bg-white/5 transition"
                    >
                      <td className="px-6 py-4 font-semibold text-white">{u.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">{u.listening}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-sm font-semibold">{u.reading}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-pink-600/30 text-pink-300 px-3 py-1 rounded-full text-sm font-semibold">{u.speaking}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-orange-600/30 text-orange-300 px-3 py-1 rounded-full text-sm font-semibold">{u.writing}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(u)} 
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm font-semibold transition transform hover:scale-105"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)} 
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white text-sm font-semibold transition transform hover:scale-105"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredUsers.map((u) => (
                <div 
                  key={u.id}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 hover:bg-white/15 transition"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-1">{u.name}</h3>
                    <p className="text-white/50 text-sm">Student Profile</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-blue-600/20 rounded-xl p-3 border border-blue-500/20">
                      <p className="text-blue-300 text-xs font-semibold uppercase mb-1">Listening</p>
                      <p className="text-2xl font-bold text-blue-200">{u.listening}</p>
                    </div>
                    <div className="bg-purple-600/20 rounded-xl p-3 border border-purple-500/20">
                      <p className="text-purple-300 text-xs font-semibold uppercase mb-1">Reading</p>
                      <p className="text-2xl font-bold text-purple-200">{u.reading}</p>
                    </div>
                    <div className="bg-pink-600/20 rounded-xl p-3 border border-pink-500/20">
                      <p className="text-pink-300 text-xs font-semibold uppercase mb-1">Speaking</p>
                      <p className="text-2xl font-bold text-pink-200">{u.speaking}</p>
                    </div>
                    <div className="bg-orange-600/20 rounded-xl p-3 border border-orange-500/20">
                      <p className="text-orange-300 text-xs font-semibold uppercase mb-1">Writing</p>
                      <p className="text-2xl font-bold text-orange-200">{u.writing}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(u)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition transform hover:scale-105"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold transition transform hover:scale-105"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-white/60 text-lg">No students found. Add your first student!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;