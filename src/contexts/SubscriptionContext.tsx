import { createContext, useContext, useState, type ReactNode } from "react";
import type { SubscriptionPlan, SubscriptionStatus } from "../services/subscriptionService";
import { useSubscription } from "../hooks/useSubscription";

export interface SubscriptionContextValue {
  sub: SubscriptionStatus | null;
  tier: number;
  tierName: string;
  isActive: boolean;
  hasFeature: (feature: string) => boolean;
  refresh: () => Promise<void>;
  doPayment: (tier: number) => Promise<boolean>;
  plans: SubscriptionPlan[];
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (v: boolean) => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  sub: null,
  tier: 0,
  tierName: "Free",
  isActive: false,
  hasFeature: () => false,
  refresh: async () => {},
  doPayment: async () => false,
  plans: [],
  showSubscriptionModal: false,
  setShowSubscriptionModal: () => {},
});

export const useSubscriptionContext = () => useContext(SubscriptionContext);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const subscription = useSubscription();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  return (
    <SubscriptionContext.Provider value={{ ...subscription, showSubscriptionModal, setShowSubscriptionModal }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
