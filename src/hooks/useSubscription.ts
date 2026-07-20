import { useState, useEffect, useCallback } from "react";
import {
  getSubscriptionStatus,
  createRazorpaySubscription,
  getSubscriptionPlans,
  verifyPayment,
  type SubscriptionPlan,
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
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

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

  useEffect(() => {
    getSubscriptionPlans().then(setPlans).catch(() => {
      // Prices are unavailable until the API is reachable; do not show a client-side price.
    });
  }, []);

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
      const subData = await createRazorpaySubscription(selectedTier);
      if (subData.tier !== selectedTier) {
        throw new Error("The payment gateway returned a different plan. Please try again.");
      }
      return await initRazorpayCheckout(subData);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Payment could not be initiated.";
      console.error("Payment error:", err?.response?.data || err);
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
    plans,
  };
}

function initRazorpayCheckout(subData: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay === "undefined") {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => openRazorpay(subData, resolve, reject);
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK."));
      document.body.appendChild(script);
    } else {
      openRazorpay(subData, resolve, reject);
    }
  });
}

function openRazorpay(
  subData: any,
  resolve: (v: boolean) => void,
  reject: (e: Error) => void
) {
  const rzp = new window.Razorpay({
    key: subData.key_id,
    subscription_id: subData.subscription_id,
    name: subData.name || "AI Life Manager",
    description: subData.description || "",
    prefill: subData.prefill || {},
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
