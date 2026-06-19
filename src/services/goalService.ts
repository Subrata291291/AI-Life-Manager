import axios from "axios";

const API =
  "http://localhost/ai-life-manager/wp-json/alm/v1";

export const getGoals = async () => {
  const response = await axios.get(
    `${API}/goals`
  );

  return response.data;
};

export const createGoal = async (
  goalData: any
) => {
  const response = await axios.post(
    `${API}/goals`,
    goalData
  );

  return response.data;
};

export const deleteGoal = async (
  id: number
) => {

  const response =
    await axios.delete(
      `${API}/goals/${id}`
    );

  return response.data;
};

export const updateGoal = async (
  goalData: any
) => {

  const response =
    await axios.put(
      `${API}/goals`,
      goalData
    );

  return response.data;
};

export const addMoneyToGoal = async (
    id: number,
    amount: number
  ) => {

    const response =
      await axios.post(
        `${API}/goals/add-money`,
        {
          id,
          amount,
        }
      );

    return response.data;
};