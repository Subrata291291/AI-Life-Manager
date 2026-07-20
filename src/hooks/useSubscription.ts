import { useState, useEffect, useCallback } from "react";
import {
  getSubscriptionStatus,
  createRazorpayOrder,
  verifyPayment,
  type SubscriptionStatus,
} from "../services/subscriptionService";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const TIER_NAMES: Record<number, string> = {
  0: "Free",
  1: "Tasks",
  2: "Essential",
  3: "Premium",
};

export function useSubscription() {
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getSubscriptionStatus();
      setSub(data);
      localStorage.setItem("subscription", JSON.stringify(data));
    } catch {
      const stored = localStorage.getItem("subscription");
      if (stored) {
        try {
          setSub(JSON.parse(stored));
        } catch { /* ignore */ }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const tier = sub?.tier ?? 0;
  const tierName = TIER_NAMES[tier] ?? "Free";
  const isActive = sub?.status === "active";
  const hasFeature = useCallback(
    (feature: string) => {
      return tier === 3 || (sub?.features ?? []).includes(feature);
    },
    [tier, sub?.features]
  );

  const doPayment = async (selectedTier: number): Promise<boolean> => {
    try {
      const order = await createRazorpayOrder(selectedTier);
      return await initRazorpayCheckout(order);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Payment could not be initiated.";
      throw new Error(msg);
    }
  };

  return {
    sub,
    loading,
    tier,
    tierName,
    isActive,
    hasFeature,
    refresh: fetchStatus,
    doPayment,
  };
}

function initRazorpayCheckout(order: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay === "undefined") {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => openRazorpay(order, resolve, reject);
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK."));
      document.body.appendChild(script);
    } else {
      openRazorpay(order, resolve, reject);
    }
  });
}

function openRazorpay(
  order: any,
  resolve: (v: boolean) => void,
  reject: (e: Error) => void
) {
  const rzp = new window.Razorpay({
    key: order.key_id,
    amount: order.amount,
    currency: order.currency || "INR",
    name: order.name || "AI Life Manager",
    description: order.description || "",
    order_id: order.order_id,
    prefill: order.prefill || {},
    handler: async (response: any) => {
      try {
        await verifyPayment(response);
        resolve(true);
      } catch {
        reject(new Error("Payment verification failed."));
      }
    },
    modal: { ondismiss: () => resolve(false) },
  });
  rzp.on("payment.failed", (resp: any) => {
    reject(new Error(resp.error?.description || "Payment failed."));
  });
  rzp.open();
}
