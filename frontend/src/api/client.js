import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

function getSavedToken() {
  const directToken =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("authToken");

  if (directToken) return directToken;

  try {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    return authUser.token || authUser.access_token || "";
  } catch {
    return "";
  }
}

function saveLoginData(data) {
  if (!data) return;

  const token = data.access_token || data.token;

  if (token) {
    localStorage.setItem("token", token);
    localStorage.setItem("access_token", token);
  }

  if (data.role) {
    localStorage.setItem("role", data.role);
  }

  if (data.user_id) {
    localStorage.setItem("user_id", data.user_id);
  }

  localStorage.setItem("authUser", JSON.stringify(data));
}

api.interceptors.request.use((config) => {
  const token = getSavedToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const url = response.config?.url || "";

    if (
      url.includes("/auth/login/patient") ||
      url.includes("/auth/login/admin") ||
      url.includes("/auth/login/otp")
    ) {
      saveLoginData(response.data);
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";

      if (!url.includes("/auth/login")) {
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("authUser");
        localStorage.removeItem("user_id");
      }
    }

    return Promise.reject(error);
  }
);

export default api;

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

export const getDoctors = (params = {}) =>
  api.get("/doctors/", { params });

export const getDepartments = (params = {}) =>
  api.get("/doctors/departments", { params });

export const getDoctorById = (doctorId) =>
  api.get(`/doctors/${doctorId}`);

export const getMyAppointments = () =>
  api.get("/appointments/me");

export const bookAppointment = (payload) =>
  api.post("/appointments/", payload);

export const getAdminAppointments = (params = {}) =>
  api.get("/appointments/", { params });

export const getAdminDashboardSummary = () =>
  api.get("/admin/dashboard/summary");

export const getCityAdminsMonitoring = () =>
  api.get("/admin/dashboard/city-admins");

export const askPatientAI = (question, context = "") =>
  api.post("/ai/patient", { question, context });

export const getAdminAIInsight = () =>
  api.post("/ai/admin-insight");
