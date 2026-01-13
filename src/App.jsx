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

  // Fetch users
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

  // Input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit
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
      alert("⚠️ Barcha ballar 0–75 oralig‘ida bo‘lishi kerak!");
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
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Saqlashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (confirm("Rostdan o‘chirmoqchimisiz?")) {
      await api.delete(`/${id}`);
      fetchUsers();
    }
  };

  // Edit
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
    setModalOpen(true);
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-900 to-violet-800 text-white p-6">
      <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-2xl rounded-3xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-violet-300">
          ⚙️ Admin Panel (IELTS Scores)
        </h1>

        {/* Search + Add */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20"
          />
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
            className="bg-violet-600 hover:bg-violet-700 px-5 py-2 rounded-lg font-semibold"
          >
            + Add Student
          </button>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-violet-700/40">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Listening</th>
                <th className="py-3 px-4">Reading</th>
                <th className="py-3 px-4">Speaking</th>
                <th className="py-3 px-4">Writing</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <tr key={u.id} className={i % 2 ? "bg-white/5" : "bg-white/10"}>
                  <td className="py-2 px-4">{u.name}</td>
                  <td className="py-2 px-4 text-center">{u.listening}</td>
                  <td className="py-2 px-4 text-center">{u.reading}</td>
                  <td className="py-2 px-4 text-center">{u.speaking}</td>
                  <td className="py-2 px-4 text-center">{u.writing}</td>
                  <td className="py-2 px-4 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(u)}
                      className="bg-amber-500 px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="bg-rose-500 px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden grid gap-4">
          {filteredUsers.map((u) => (
            <div key={u.id} className="bg-violet-900/40 p-4 rounded-2xl">
              <h3 className="font-semibold">{u.name}</h3>
              <p>🎧 Listening: {u.listening}</p>
              <p>📘 Reading: {u.reading}</p>
              <p>🗣 Speaking: {u.speaking}</p>
              <p>✍️ Writing: {u.writing}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="bg-white text-black p-6 rounded-xl w-11/12 md:w-1/2 space-y-3"
          >
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              required
            />
            <input
              name="listening"
              type="number"
              value={formData.listening}
              onChange={handleChange}
              placeholder="Listening"
              required
            />
            <input
              name="reading"
              type="number"
              value={formData.reading}
              onChange={handleChange}
              placeholder="Reading"
              required
            />
            <input
              name="speaking"
              type="number"
              value={formData.speaking}
              onChange={handleChange}
              placeholder="Speaking"
              required
            />
            <input
              name="writing"
              type="number"
              value={formData.writing}
              onChange={handleChange}
              placeholder="Writing"
              required
            />

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit">{loading ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
