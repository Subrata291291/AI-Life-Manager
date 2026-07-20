import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Lightbulb,
  Receipt,
  Target,
  TimerReset,
} from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { getDashboardStats } from "../../services/dashboardService";
import ExpenseChart from "../../components/ExpenseChart";
import MonthlyExpenseChart from "../../components/MonthlyExpenseChart";

interface DashboardStats {
  tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_rate: number;
  expenses: number;
  bills: number;
  goals: number;

  recent_tasks: any[];
  upcoming_bills: any[];
  active_goals: any[];

  monthly_expenses: {
    month: string;
    total: string;
  }[];

  insights: {
    expenses: string | null;
    goal: string | null;
    bill: string | null;
  };
}

interface KpiCard {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "amber" | "teal";
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    completion_rate: 0,
    expenses: 0,
    bills: 0,
    goals: 0,
    recent_tasks: [],
    upcoming_bills: [],
    active_goals: [],
    monthly_expenses: [],
    insights: {
      expenses: null,
      goal: null,
      bill: null,
    },
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      }
    };
    fetchStats();
  }, []);

  const kpiCards: KpiCard[] = [
    {
      label: "Total tasks",
      value: stats.tasks,
      detail: `${stats.completed_tasks} completed`,
      icon: ClipboardList,
      tone: "blue",
    },
    {
      label: "Completion rate",
      value: `${stats.completion_rate}%`,
      detail: `${stats.pending_tasks} pending tasks`,
      icon: CheckCircle2,
      tone: "green",
    },
    {
      label: "Total expenses",
      value: formatCurrency(stats.expenses),
      detail: "Tracked spending",
      icon: CircleDollarSign,
      tone: "amber",
    },
    {
      label: "Active goals",
      value: stats.goals,
      detail: `${stats.bills} upcoming bills`,
      icon: Target,
      tone: "teal",
    },
  ];

  const insights = [
    stats.insights.expenses,
    stats.insights.goal,
    stats.insights.bill,
  ].filter(Boolean);

  return (
    <MainLayout>
      <div className="dashboard">
        <section className="dashboard-hero">
          <div>
            <span className="dashboard-eyebrow">Overview</span>
            <h1>Dashboard</h1>
            <p>
              A focused snapshot of your tasks, money, bills, and goals.
            </p>
          </div>

          <div className="dashboard-hero__stat">
            <Activity size={20} />
            <div>
              <strong>{stats.completion_rate}%</strong>
              <span>Completion rate</span>
            </div>
          </div>
        </section>

        <section className="dashboard-kpis">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                className={`kpi-card kpi-card--${card.tone}`}
                key={card.label}
              >
                <div className="kpi-card__top">
                  <span className="kpi-card__icon">
                    <Icon size={20} />
                  </span>
                  <ArrowUpRight size={18} />
                </div>
                <span className="kpi-card__label">
                  {card.label}
                </span>
                <strong>{card.value}</strong>
                <small>{card.detail}</small>
              </article>
            );
          })}
        </section>

        <section className="dashboard-grid">
            <article className="dashboard-panel dashboard-panel--wide">
              <div className="panel-heading">
                <div>
                  <span>Spending trend</span>
                  <h2>Monthly Expenses</h2>
                </div>
              </div>
              <MonthlyExpenseChart data={stats.monthly_expenses} />
            </article>

            <article className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <span>Category mix</span>
                  <h2>Expense Breakdown</h2>
                </div>
              </div>
              <ExpenseChart />
            </article>
          </section>

          <section className="dashboard-lower-grid">
            <article className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <span>Recommendations</span>
                  <h2>AI Insights</h2>
                </div>
                <Lightbulb size={19} />
              </div>

              {insights.length === 0 ? (
                <p className="empty-state">No insights available yet.</p>
              ) : (
                <ul className="insight-list">
                  {insights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              )}
            </article>

            <article className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <span>Work queue</span>
                  <h2>Recent Tasks</h2>
                </div>
                <TimerReset size={19} />
              </div>

              {stats.recent_tasks.length === 0 ? (
                <p className="empty-state">No tasks found.</p>
              ) : (
                <ul className="activity-list">
                  {stats.recent_tasks.map((task: any) => (
                    <li key={task.id}>
                      <div>
                        <strong>{task.title}</strong>
                        <span>Task status</span>
                      </div>
                      <span className="status-pill">{task.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <span>Cash flow</span>
                  <h2>Upcoming Bills</h2>
                </div>
                <Receipt size={19} />
              </div>

              {stats.upcoming_bills.length === 0 ? (
                <p className="empty-state">No bills found.</p>
              ) : (
                <ul className="activity-list">
                  {stats.upcoming_bills.map((bill: any) => (
                    <li key={bill.id}>
                      <div>
                        <strong>{bill.bill_name}</strong>
                        <span>Upcoming payment</span>
                      </div>
                      <span className="amount-pill">
                        {formatCurrency(Number(bill.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <span>Progress</span>
                  <h2>Active Goals</h2>
                </div>
                <Target size={19} />
              </div>

              {stats.active_goals.length === 0 ? (
                <p className="empty-state">No goals found.</p>
              ) : (
                <div className="goal-stack">
                  {stats.active_goals.map((goal: any) => {
                    const progress =
                      Math.min(
                        100,
                        Math.round(
                          (Number(goal.current_amount) / Number(goal.target_amount)) * 100
                        )
                      ) || 0;

                    return (
                      <div key={goal.id} className="goal-row">
                        <div className="goal-row__top">
                          <strong>{goal.goal_name}</strong>
                          <span>{progress}%</span>
                        </div>
                        <div className="progress">
                          <div
                            className="progress-bar"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </section>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
