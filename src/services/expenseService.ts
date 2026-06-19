import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = API_BASE_URL;

export const getExpenses = async () => {
  const response = await axios.get(
    `${API}/expenses`
  );

  return response.data;
};

export const deleteExpense = async (
  id: number
) => {
  const response = await axios.delete(
    `${API}/expenses/${id}`
  );

  return response.data;
};

export const createExpense = async (
  expenseData: any
) => {
  const response = await axios.post(
    `${API}/expenses`,
    expenseData
  );

  return response.data;
};

export const updateExpense = async (
  expenseData: any
) => {

  const response =
    await axios.put(
      `${API}/expenses`,
      expenseData
    );

  return response.data;
};

