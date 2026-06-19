import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const API = API_BASE_URL;

export const getTasks = async () => {
  const response = await axios.get(`${API}/tasks`);
  return response.data;
};

export const createTask = async (data: any) => {
  const response = await axios.post(`${API}/tasks`, data);
  return response.data;
};

export const deleteTask = async (
  id: number
) => {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const response = await fetch(
    `${API}/tasks/${id}`,
    {
      method: "DELETE",
      headers: {
        "X-ALM-User-ID": String(
          user.id ||
          user.ID ||
          user.user_id ||
          ""
        ),
      },
    }
  );

  return response.json();
};
