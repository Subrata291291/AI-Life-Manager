import axios from "axios";

const API =
  "http://localhost/ai-life-manager/wp-json/alm/v1";

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
    `http://localhost/ai-life-manager/wp-json/alm/v1/tasks/${id}`,
    {
      method: "DELETE",
    }
  );

  return response.json();
};