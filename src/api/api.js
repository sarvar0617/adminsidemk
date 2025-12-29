import axios from "axios";
const api = axios.create({
  baseURL: "https://69523bc73b3c518fca11e74f.mockapi.io/mock",
  headers: { "Content-Type": "application/json" },
});
export default api;
