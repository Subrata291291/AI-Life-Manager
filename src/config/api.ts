import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://salujaautomobile.com/ai-life-manager/wp-json/alm/v1";

const getStoredUserId = () => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return "";

  try {
    const user = JSON.parse(storedUser);
    const uid = user.user_id || user.id || user.ID || "";
    return String(uid);
  } catch {
    return "";
  }
};

axios.interceptors.request.use((config) => {
  const userId = getStoredUserId();
  if (userId) {
    config.headers["X-ALM-User-ID"] = userId;
  }
  return config;
});

export const pingApi = async () => {
  const response = await axios.get(`${API_BASE_URL}/ping`);
  return response.data;
};
