import { useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getExpenses } from "../services/expenseService";

interface CategoryData {
  name: string;
  value: number;
}

const COLORS = [
  "#60a5fa",
  "#2dd4bf",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#34d399",
  "#fb923c",
  "#e879f9",
];

const ExpenseChart = () => {
  const [chartData, setChartData] =
    useState<CategoryData[]>([]);

  useEffect(() => {
    const fetchAndAggregate =
      async () => {
        try {
          const expenses =
            await getExpenses();

          // Aggregate expenses by category
          const categoryMap: Record<
            string,
            number
          > = {};

          expenses.forEach(
            (expense: any) => {
              const category =
                expense.category ||
                "Other";

              const amount = Number(
                expense.amount
              );

              if (categoryMap[category]) {
                categoryMap[category] +=
                  amount;
              } else {
                categoryMap[category] =
                  amount;
              }
            }
          );

          // Convert to chart data format
          const data: CategoryData[] =
            Object.entries(
              categoryMap
            ).map(([name, value]) => ({
              name,
              value,
            }));

          setChartData(data);
        } catch (error) {
          console.error(
            "Failed to load expense chart data:",
            error
          );
        }
      };

    fetchAndAggregate();
  }, []);

  if (chartData.length === 0) {
    return (
      <div className="chart-box">
        <p className="empty-state">
          No expense data available.
        </p>
      </div>
    );
  }

  return (
    <div className="chart-box">
      <ResponsiveContainer
        width="100%"
        height={280}
      >
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={98}
            paddingAngle={4}
          >
            {chartData.map(
              (item, index) => (
                <Cell
                  key={item.name}
                  fill={
                    COLORS[
                      index %
                        COLORS.length
                    ]
                  }
                />
              )
            )}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseChart;
