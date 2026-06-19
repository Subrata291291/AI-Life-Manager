import { useEffect, useState } from "react";
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
    expenses: string;
    goal: string;
    bill: string;
  };
}

const Dashboard = () => {

  const [stats, setStats] =
    useState<DashboardStats>({
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
        expenses: "",
        goal: "",
        bill: "",
      },
    });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error(
          "Failed to load dashboard stats:",
          error
        );
      }
    };

    fetchStats();
  }, []);

  return (
    <MainLayout>

      <h2 className="mb-3">
        Dashboard
      </h2>

      {/* Statistics Cards */}

      <div className="row">

        <div className="col-md-3 mb-3">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6>Total Tasks</h6>
              <h2>{stats.tasks}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6>Completed Tasks</h6>
              <h2>{stats.completed_tasks}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6>Pending Tasks</h6>
              <h2>{stats.pending_tasks}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6>Completion Rate</h6>
              <h2>{stats.completion_rate}%</h2>
            </div>
          </div>
        </div>

      </div>

        <div className="mb-3 card shadow-sm">
          <div className="card-body">

            <h5 className="mb-3">
              Monthly Expenses
            </h5>

            <MonthlyExpenseChart
              data={stats.monthly_expenses}
            />

          </div>
        </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6>Total Expenses</h6>
              <h2>₹{stats.expenses}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6>Total Bills</h6>
              <h2>{stats.bills}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6>Total Goals</h6>
              <h2>{stats.goals}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Chart */}

      <div className="card shadow-sm">
        <div className="card-body">

          <h5 className="mb-3">
            Expense Breakdown
          </h5>

          <ExpenseChart />

        </div>
      </div>

      {/* AI Insights */}

      <div className="card mt-3 shadow-sm">
        <div className="card-body">

          <h5 className="mb-3">
            AI Insights
          </h5>

          <ul className="mb-0">

            <li>
              {stats.insights.expenses}
            </li>

            <li>
              {stats.insights.goal}
            </li>

            <li>
              {stats.insights.bill}
            </li>

          </ul>

        </div>
      </div>

      <div className="card mt-3 shadow-sm">
        <div className="card-body">

          <h5 className="mb-3">
            Recent Tasks
          </h5>

          {stats.recent_tasks.length === 0 ? (
            <p>No tasks found</p>
          ) : (
            <ul className="mb-0">

              {stats.recent_tasks.map(
                (task: any) => (
                  <li key={task.id}>
                    {task.title}
                    {" - "}
                    {task.status}
                  </li>
                )
              )}

            </ul>
          )}

        </div>
      </div>

      <div className="card mt-3 shadow-sm">
        <div className="card-body">

          <h5 className="mb-3">
            Upcoming Bills
          </h5>

          {stats.upcoming_bills.length === 0 ? (
            <p>No bills found</p>
          ) : (
            <ul className="mb-0">

              {stats.upcoming_bills.map(
                (bill: any) => (
                  <li key={bill.id}>
                    {bill.bill_name}
                    {" - ₹"}
                    {bill.amount}
                  </li>
                )
              )}

            </ul>
          )}

        </div>
      </div>

      <div className="card mt-3 shadow-sm">
        <div className="card-body">

          <h5 className="mb-3">
            Active Goals
          </h5>

          {stats.active_goals.length === 0 ? (
            <p>No goals found</p>
          ) : (
            stats.active_goals.map(
              (goal: any) => {

                const progress =
                  Math.round(
                    (
                      Number(goal.current_amount) /
                      Number(goal.target_amount)
                    ) * 100
                  );

                return (
                  <div
                    key={goal.id}
                    className="mb-3"
                  >

                    <strong>
                      {goal.goal_name}
                    </strong>

                    <div className="progress mt-2">

                      <div
                        className="progress-bar"
                        style={{
                          width: `${progress}%`,
                        }}
                      >
                        {progress}%
                      </div>

                    </div>

                  </div>
                );
              }
            )
          )}

        </div>
      </div>

    </MainLayout>
  );
};

export default Dashboard;