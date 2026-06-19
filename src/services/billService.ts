import axios from "axios";

const API =
  "http://localhost/ai-life-manager/wp-json/alm/v1";

export const getBills = async () => {

  const response =
    await axios.get(
      `${API}/bills`
    );

  return response.data;
};

export const createBill = async (
  billData: any
) => {

  const response =
    await axios.post(
      `${API}/bills`,
      billData
    );

  return response.data;
};

export const updateBill = async (
  billData: any
) => {

  const response =
    await axios.put(
      `${API}/bills`,
      billData
    );

  return response.data;
};

export const markBillPaid = async (
  id: number
) => {

  const response =
    await axios.put(
      `${API}/bills/${id}/paid`
    );

  return response.data;
};

export const deleteBill = async (
  id: number
) => {

  const response =
    await axios.delete(
      `${API}/bills/${id}`
    );

  return response.data;
};