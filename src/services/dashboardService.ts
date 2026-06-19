import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = API_BASE_URL;

export const getDashboardStats =
  async () => {

    const response =
      await axios.get(
        `${API}/dashboard`
      );

    return response.data;
};
