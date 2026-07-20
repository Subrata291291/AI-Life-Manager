import { useState, useEffect, useRef } from "react";
import { CheckCircle, Crown, Sparkles, Zap, X } from "lucide-react";
import type { SubscriptionPlan } from "../../services/subscriptionService";

const TIERS = [
  { id: 1, name: "Tasks", price: "₹499", priceLabel: "/month", icon: Zap, color: "#6366f1", features: [
    "Create & manage unlimited tasks", "Set priority & deadlines", "Track completion status", "Task dashboard & insights",
  ]},
  { id: 2, name: "Essential", price: "₹999", priceLabel: "/month", icon: Sparkles, color: "#14b8a6", recommended: true, features: [
    "Everything in Tasks", "Unlimited expense tracking", "Category-wise spending", "Expense charts & breakdown", "Monthly spending insights",
  ]},
  { id: 3, name: "Premium", price: "₹1,499", priceLabel: "/month", icon: Crown, color: "#f59e0b", features: [
    "Everything in Essential", "Bill management & reminders", "Goal setting & progress", "Recurring bill tracking", "All current & future features",
  ]},
];

interface Props {
  show: boolean;
  onClose: () => void;
  onSubscribe: (tier: number) => Promise<void>;
  currentTier: number;
  plans: SubscriptionPlan[];
}

const formatPrice = (amount?: number) => amount === undefined
  ? "—"
  : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount / 100);

const SubscriptionModal = ({ show, onClose, onSubscribe, currentTier, plans }: Props) => {
  const [selectedTier, setSelectedTier] = useState(2);
  const [busy, setBusy] = useState(false);
  const [animState, setAnimState] = useState<"closed" | "entering" | "open" | "leaving">("closed");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (show) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setAnimState("entering");
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimState("open")));
    } else if (animState === "open" || animState === "entering") {
      setAnimState("leaving");
      timerRef.current = setTimeout(() => setAnimState("closed"), 220);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [show]);

  if (animState === "closed") return null;

  const isVisible = animState === "open" || animState === "entering";

  const handleSubscribe = async (tier: number) => {
    setBusy(true);
    try {
      await onSubscribe(tier);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="alm-overlay" style={{ opacity: isVisible ? 1 : 0, transition: "opacity 200ms ease" }}>
      <div className="alm-overlay__backdrop" onClick={onClose} />
      <div
        className="alm-overlay__panel"
        style={{
          transform: isVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.97)",
          opacity: isVisible ? 1 : 0,
          transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease",
        }}
      >
        <button className="alm-overlay__close" onClick={onClose}><X size={20} /></button>

        <div className="alm-overlay__hero">
          <div className="alm-overlay__pill">Upgrade your experience</div>
          <h2>Choose the right plan for you</h2>
          <p>Unlock the features you need and take full control of your life</p>
        </div>

        <div className="alm-overlay__body">
          <div className="subscription-tiers">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              const plan = plans.find((item) => item.id === tier.id);
              const isCurrent = currentTier >= tier.id;
              const isSelected = selectedTier === tier.id;
              return (
                <div
                  key={tier.id}
                  className={`tier-card card${isSelected ? " tier-card--selected" : ""}${tier.recommended ? " tier-card--recommended" : ""}${isCurrent ? " tier-card--owned" : ""}`}
                  style={{ "--tier-color": tier.color } as React.CSSProperties}
                  onClick={() => !isCurrent && setSelectedTier(tier.id)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" && !isCurrent) setSelectedTier(tier.id); }}
                >
                  {tier.recommended && !isCurrent && <span className="tier-card__badge">Best Value</span>}
                  {isCurrent && <span className="tier-card__badge tier-card__badge--owned">Current Plan</span>}

                  <div className="tier-card__icon-wrap">
                    <div className="tier-card__icon"><Icon size={24} /></div>
                  </div>
                  <h5 className="tier-card__name">{tier.name}</h5>

                  <div className="tier-card__price">
                    <strong>{formatPrice(plan?.amount)}</strong>
                    <span>/month</span>
                  </div>

                  <ul className="tier-card__features">
                    {tier.features.map((f) => (
                      <li key={f}><CheckCircle size={16} /><span>{f}</span></li>
                    ))}
                  </ul>

                  <button
                    className="tier-card__btn"
                    disabled={isCurrent || (busy && selectedTier === tier.id)}
                    onClick={(e) => { e.stopPropagation(); if (!isCurrent) { setSelectedTier(tier.id); handleSubscribe(tier.id); } }}
                  >
                    {isCurrent ? "Active" : `Choose ${tier.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
