import { X } from "lucide-react";

interface Props {
  show: boolean;
  onClose: () => void;
}

const sections = [
  {
    title: "Getting Started",
    items: [
      "Create an account or log in to access your workspace",
      "Choose a subscription plan (Free / Tasks / Essential / Premium) to unlock features",
      "Navigate using the sidebar — Dashboard, Tasks, Expenses, Bills, Goals",
    ],
  },
  {
    title: "Tasks",
    items: [
      "Create tasks with a title, description, priority (Low / Medium / High), and schedule",
      "Status auto-updates: Upcoming → In Progress → Completed / Overdue",
      "Use the dashboard to view recent tasks and completion rate",
    ],
  },
  {
    title: "Expenses",
    items: [
      "Log expenses with amount, category (Food / Travel / Shopping / etc.), and notes",
      "Filter by category, date range, or search notes",
      "View monthly spending trends and category breakdown charts on the dashboard",
    ],
  },
  {
    title: "Bills",
    items: [
      "Add bills with amount, due date, and recurring frequency",
      "Mark bills as paid when settled",
      "Filter by status: All / Paid / Upcoming / Due Today / Overdue",
    ],
  },
  {
    title: "Goals",
    items: [
      "Set financial goals with a target amount and target date",
      "Use 'Add Money' to track progress incrementally",
      "Progress bar shows completion percentage with color coding",
    ],
  },
  {
    title: "Subscription & Billing",
    items: [
      "Free tier includes task management",
      "Upgrade to Essential (₹999/mo) to unlock expense tracking",
      "Premium (₹1,499/mo) adds bills and goals",
      "Payments are processed securely via Razorpay — recurring monthly billing",
    ],
  },
];

const HelpModal = ({ show, onClose }: Props) => {
  if (!show) return null;

  return (
    <div className="alm-overlay" style={{ opacity: 1, transition: "opacity 200ms ease" }}>
      <div className="alm-overlay__backdrop" onClick={onClose} />
      <div
        className="alm-overlay__panel"
        style={{
          maxWidth: "640px",
          transform: "translateY(0) scale(1)",
          opacity: 1,
          transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease",
        }}
      >
        <button className="alm-overlay__close" onClick={onClose}><X size={20} /></button>

        <div className="alm-overlay__hero" style={{ padding: "2rem 1.5rem" }}>
          <h2 style={{ margin: 0 }}>Help & Guide</h2>
          <p style={{ margin: "0.25rem 0 0" }}>How to use AI Life Manager</p>
        </div>

        <div className="alm-overlay__body" style={{ padding: "1.5rem" }}>
          {sections.map((section) => (
            <div key={section.title} style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ margin: "0 0 0.5rem", fontWeight: 700 }}>{section.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.7 }}>
                {section.items.map((item) => (
                  <li key={item} style={{ color: "var(--text-soft)", fontSize: "0.9rem" }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
