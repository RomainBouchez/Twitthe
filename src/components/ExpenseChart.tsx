// src/components/ExpenseChart.tsx
"use client";

import { useTheme } from "next-themes";
import { format } from "date-fns";
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";

type DailyExpense = {
  date: Date;
  amount: number;
};

interface ExpenseChartProps {
  data: DailyExpense[];
}

export default function ExpenseChart({ data }: ExpenseChartProps) {
  const { theme } = useTheme();
  
  // Format the chart data for display
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "MMM d"),
    amount: Number(item.amount.toFixed(2)),
  }));

  // Get appropriate colors based on theme
  const getStrokeColor = () => theme === "dark" ? "#9DC3E6" : "#2F80ED";
  const getFillColor = () => theme === "dark" ? "rgba(157, 195, 230, 0.2)" : "rgba(47, 128, 237, 0.2)";
  const getGridColor = () => theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
  const getTextColor = () => theme === "dark" ? "#e1e1e1" : "#333333";

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No expense data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={getStrokeColor()} stopOpacity={0.8} />
            <stop offset="95%" stopColor={getStrokeColor()} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={getGridColor()} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: getTextColor() }} 
          tickLine={{ stroke: getGridColor() }}
          axisLine={{ stroke: getGridColor() }}
        />
        <YAxis 
          tickFormatter={formatCurrency} 
          tick={{ fill: getTextColor() }} 
          tickLine={{ stroke: getGridColor() }}
          axisLine={{ stroke: getGridColor() }}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(value as number), "Amount"]}
          contentStyle={{
            backgroundColor: theme === "dark" ? "#1E1E1E" : "#FFFFFF",
            borderColor: getGridColor(),
            color: getTextColor(),
          }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke={getStrokeColor()}
          fillOpacity={1}
          fill="url(#colorAmount)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}