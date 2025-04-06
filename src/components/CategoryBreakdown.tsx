"use client";

import { useTheme } from "next-themes";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

type Category = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  total: number;
};

interface CategoryBreakdownProps {
  categories: Category[];
}

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  const { theme } = useTheme();
  
  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Get appropriate colors based on theme
  const getTextColor = () => theme === "dark" ? "#e1e1e1" : "#333333";

  // Prepare data for the chart
  const chartData = categories.map((category) => ({
    name: category.name,
    value: Number(category.total.toFixed(2)),
    color: category.color || "#A7C5EB",
    icon: category.icon || "more-horizontal",
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border p-2 rounded-md shadow-sm">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: payload[0].payload.color }}
            ></div>
            <p className="font-medium">{payload[0].name}</p>
          </div>
          <p className="text-sm mt-1">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto text-sm">
        {payload.map((entry: any, index: number) => (
          <li key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <div className="flex-1">{entry.value}</div>
            <div className="font-medium">{formatCurrency(entry.payload.value)}</div>
          </li>
        ))}
      </ul>
    );
  };

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No category data available</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="70%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="mt-4">
        <CustomLegend payload={chartData} />
      </div>
    </div>
  );
}