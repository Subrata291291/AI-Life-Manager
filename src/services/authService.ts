import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = API_BASE_URL;

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

export const register = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const response = await axios.post(
    `${API}/auth/register`,
    data
  );

  return response.data;
};

export const verifyEmail = async (data: {
  email: string;
  token: string;
}) => {
  const response = await axios.post(
    `${API}/auth/verify-email`,
    data
  );

  return response.data;
};

export const forgotPassword = async (data: {
  email: string;
}) => {
  const response = await axios.post(
    `${API}/auth/forgot-password`,
    data
  );

  return response.data;
};

export const resetPassword = async (data: {
  email: string;
  token: string;
  password: string;
}) => {
  const response = await axios.post(
    `${API}/auth/reset-password`,
    data
  );

  return response.data;
};
