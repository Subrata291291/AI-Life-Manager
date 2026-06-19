import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const data = [
  {
    name: "Food",
    value: 500,
  },
  {
    name: "Travel",
    value: 300,
  },
  {
    name: "Bills",
    value: 700,
  },
];

const colors = [
  "#60a5fa",
  "#2dd4bf",
  "#fbbf24",
];

const ExpenseChart = () => {
  return (
    <div className="chart-box">
      <ResponsiveContainer
        width="100%"
        height={280}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={98}
            paddingAngle={4}
          >
            {data.map((item, index) => (
              <Cell
                key={item.name}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseChart;
