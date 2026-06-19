import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = API_BASE_URL;

export const getNotifications =
  async () => {

    const response =
      await axios.get(
        `${API}/notifications`
      );

    return response.data;
};

export const markNotificationRead =
  async (id: number) => {

    return axios.post(
      `${API}/notifications/read`,
      { id }
    );
};

export const deleteNotification =
  async (id: number) => {

    return axios.delete(
      `${API}/notifications/${id}`
    );
};
