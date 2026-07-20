import type { ReactNode } from "react";
import { Crown, Lock } from "lucide-react";

interface SubscriptionGateProps {
  feature: string;
  hasAccess: boolean;
  onUpgrade: () => void;
  children: ReactNode;
}

const FEATURE_LABELS: Record<string, string> = {
  tasks: "Task Management",
  expenses: "Expense Tracking",
  bills: "Bill Management",
  goals: "Goal Setting",
};

const SubscriptionGate = ({
  feature,
  hasAccess,
  onUpgrade,
  children,
}: SubscriptionGateProps) => {
  if (hasAccess) {
    return <>{children}</>;
  }

  const label = FEATURE_LABELS[feature] || feature;

  return (
    <div className="feature-gate">
      <div className="feature-gate__blur">{children}</div>
      <div className="feature-gate__overlay">
        <div className="feature-gate__card">
          <div className="feature-gate__icon">
            <Lock size={28} />
          </div>
          <h4>{label} is Locked</h4>
          <p>
            Upgrade your plan to unlock {label.toLowerCase()} and take control
            of your productivity.
          </p>
          <button
            className="btn btn-primary"
            onClick={onUpgrade}
            type="button"
          >
            <Crown size={16} className="me-1" />
            Upgrade to Unlock
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionGate;
