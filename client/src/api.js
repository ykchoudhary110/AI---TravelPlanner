import axios from "axios";
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000/api",
  timeout: 30000,
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers = { ...(config.headers||{}), Authorization: `Bearer ${token}` };
  return config;
}, e => Promise.reject(e));
API.interceptors.response.use(r=>r, e=>{ console.error("API error:", e?.response?.data||e.message); return Promise.reject(e); });
export default API;
