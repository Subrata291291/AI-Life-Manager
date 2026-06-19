import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
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
      <BarChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />

        <Bar
          dataKey="total"
          fill="#0d6efd"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyExpenseChart;