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

  const response = await fetch(
    `${API}/tasks/${id}`,
    {
      method: "DELETE",
    }
  );

  return response.json();
};
