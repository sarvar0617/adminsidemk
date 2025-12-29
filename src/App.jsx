import { useEffect, useState } from "react";
import api from "./api/api.js";

function App() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    listening: "",
    reading: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch users
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

  // 🔹 Input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const { listening, reading } = formData;
    const scores = [Number(listening), Number(reading)];

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
      setFormData({ name: "", listening: "", reading: "" });
      setIsEditing(false);
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Saqlashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete
  const handleDelete = async (id) => {
    if (confirm("Rostdan o‘chirmoqchimisiz?")) {
      await api.delete(`/${id}`);
      fetchUsers();
    }
  };

  // 🔹 Edit
  const handleEdit = (user) => {
    setIsEditing(true);
    setEditId(user.id);
    setFormData({
      name: user.name,
      listening: user.listening,
      reading: user.reading,
    });
    setModalOpen(true);
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-900 to-violet-800 text-white p-6">
      <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-violet-300">
          ⚙️ Admin Panel (Listening & Reading)
        </h1>

        {/* Search + Add */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:ring-2 focus:ring-violet-400 outline-none"
          />
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData({ name: "", listening: "", reading: "" });
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
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-center">Listening</th>
                <th className="py-3 px-4 text-center">Reading</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <tr
                  key={u.id}
                  className={`${
                    i % 2 ? "bg-white/5" : "bg-white/10"
                  } hover:bg-violet-600/30`}
                >
                  <td className="py-3 px-4">{u.name}</td>
                  <td className="py-3 px-4 text-center">{u.listening}</td>
                  <td className="py-3 px-4 text-center">{u.reading}</td>
                  <td className="py-3 px-4 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(u)}
                      className="bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="bg-rose-500 hover:bg-rose-600 px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden grid gap-4">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="bg-violet-900/40 border border-violet-700/50 rounded-2xl p-4"
            >
              <h3 className="text-lg font-semibold text-violet-300">
                {u.name}
              </h3>
              <p>🎧 Listening: {u.listening}</p>
              <p>📘 Reading: {u.reading}</p>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => handleEdit(u)}
                  className="bg-amber-500 px-3 py-1 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  className="bg-rose-500 px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 md:w-1/2 p-6">
            <h2 className="text-xl font-semibold text-center text-violet-700 mb-4">
              {isEditing ? "Edit Student" : "Add Student"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Student name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-400 bg-white text-gray-800 placeholder-gray-400 focus:border-violet-600 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              {/* Listening */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  🎧 Listening score (0–75)
                </label>
                <input
                  type="number"
                  name="listening"
                  value={formData.listening}
                  onChange={handleChange}
                  required
                  min="0"
                  max="75"
                  className="w-full px-4 py-2 rounded-lg border border-gray-400 bg-white text-gray-800 focus:border-violet-600 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              {/* Reading */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  📘 Reading score (0–75)
                </label>
                <input
                  type="number"
                  name="reading"
                  value={formData.reading}
                  onChange={handleChange}
                  required
                  min="0"
                  max="75"
                  className="w-full px-4 py-2 rounded-lg border border-gray-400 bg-white text-gray-800 focus:border-violet-600 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-400 rounded text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded text-white ${
                    loading
                      ? "bg-violet-400"
                      : "bg-violet-600 hover:bg-violet-700"
                  }`}
                >
                  {loading ? "Saving..." : isEditing ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
