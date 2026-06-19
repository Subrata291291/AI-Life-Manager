import axios from "axios";

const API =
  "http://localhost/ai-life-manager/wp-json/alm/v1";

export const getDashboardStats =
  async () => {

    const response =
      await axios.get(
        `${API}/dashboard`
      );

    return response.data;
};