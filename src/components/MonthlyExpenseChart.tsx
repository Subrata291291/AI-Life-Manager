import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Props {
  data: {
    month: string;
    total: string;
  }[];
}

const MonthlyExpenseChart = ({
  data,
}: Props) => {
  return (
    <ResponsiveContainer
      width="100%"
      height={300}
    >
      <BarChart
        data={data}
        margin={{
          top: 8,
          right: 12,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(148, 163, 184, 0.25)"
        />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />

        <Bar
          dataKey="total"
          fill="#60a5fa"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyExpenseChart;
