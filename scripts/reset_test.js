import axios from 'axios';

const api = axios.create({
  baseURL: 'https://69523bc73b3c518fca11e74f.mockapi.io/mock',
  headers: { 'Content-Type': 'application/json' },
});

async function run() {
  try {
    const res = await api.get('/');
    const users = res.data;
    console.log('Fetched users:', users.map(u => ({ id: u.id, name: u.name })));

    for (const u of users) {
      try {
        const payload = { ...u, listening: 0, reading: 0, speaking: 0, writing: 0 };
        const r = await api.put(`/${u.id}`, payload);
        console.log('PUT ok for', u.id, 'status', r.status);
      } catch (err) {
        console.error('PUT failed for', u.id, err.response?.status, err.response?.data || err.message);
        // try PATCH fallback
        try {
          const r2 = await api.patch(`/${u.id}`, { listening: 0, reading: 0, speaking: 0, writing: 0 });
          console.log('PATCH ok for', u.id, 'status', r2.status);
        } catch (err2) {
          console.error('PATCH also failed for', u.id, err2.response?.status, err2.response?.data || err2.message);
        }
      }
    }
  } catch (err) {
    console.error('Fetch users failed:', err.response?.status, err.response?.data || err.message);
  }
}

run();
