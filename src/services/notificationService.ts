import axios from "axios";

const API =
  "http://localhost/ai-life-manager/wp-json/alm/v1";

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