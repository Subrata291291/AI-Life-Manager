import {
  PieChart,
  Pie,
  Tooltip
} from "recharts";

const data = [
  {
    name: "Food",
    value: 500
  },
  {
    name: "Travel",
    value: 300
  },
  {
    name: "Bills",
    value: 700
  }
];

const ExpenseChart = () => {
  return (
    <PieChart
      width={400}
      height={300}
    >
      <Pie
        data={data}
        dataKey="value"
        outerRadius={100}
      />

      <Tooltip />
    </PieChart>
  );
};

export default ExpenseChart;