import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sh_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("sh_token");
      localStorage.removeItem("sh_user");

      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const loginPatient = (patient_id, password) =>
  api.post("/auth/login/patient", { patient_id, password });

export const loginAdmin = (username, password) =>
  api.post("/auth/login/admin", { username, password });

export const loginOtp = (phone, otp) =>
  api.post("/auth/login/otp", { phone, otp });

export const registerWithOtp = (payload) =>
  api.post("/auth/register-with-otp", payload);

export const registerPatient = (payload) =>
  api.post("/auth/register", payload);

export const getCurrentUser = () => api.get("/auth/me");

export const changePassword = (old_password, new_password) =>
  api.post("/auth/change-password", { old_password, new_password });

export default api;