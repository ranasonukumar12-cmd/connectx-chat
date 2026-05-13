import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("connectx_token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem("connectx_refresh");
        const { data } = await axios.post(
          (process.env.REACT_APP_API_URL || "http://localhost:5000/api") + "/auth/refresh",
          { refreshToken: refresh }
        );
        localStorage.setItem("connectx_token", data.token);
        original.headers.Authorization = "Bearer " + data.token;
        return api(original);
      } catch { localStorage.clear(); window.location.href = "/login"; }
    }
    const msg = err.response?.data?.error || "Something went wrong";
    if (err.response?.status !== 401) toast.error(msg);
    return Promise.reject(err);
  }
);

export default api;
