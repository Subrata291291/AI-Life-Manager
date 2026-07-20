import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = API_BASE_URL;

export interface SubscriptionStatus {
  tier: number;
  tier_name: string;
  status: "inactive" | "active" | "expired";
  expiry: string | null;
  features: string[];
  payment_id: string | null;
}

export interface RazorpayOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  name: string;
  description: string;
  prefill: {
    email: string;
    name: string;
  };
}

export interface VerifyResponse {
  success: boolean;
  tier: number;
  tier_name: string;
  status: string;
  expiry: string;
}

export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const response = await axios.get(`${API}/subscription/status`);
  return response.data;
};

export const createRazorpayOrder = async (tier: number): Promise<RazorpayOrder> => {
  const response = await axios.post(`${API}/subscription/create-order`, { tier });
  return response.data;
};

export const verifyPayment = async (data: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}): Promise<VerifyResponse> => {
  const response = await axios.post(`${API}/subscription/verify`, data);
  return response.data;
};
