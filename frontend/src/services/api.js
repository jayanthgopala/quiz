import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export default api;
