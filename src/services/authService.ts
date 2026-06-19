import axios from "axios";

const API =
  "http://localhost/ai-life-manager/wp-json/alm/v1";

export const login = async (data: {
  email: string;
  password: string;
}) => {

  const response = await axios.post(
    `${API}/auth/login`,
    data
  );

  return response.data;
};