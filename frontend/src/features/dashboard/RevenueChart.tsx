import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { revenueSeries } from "./dashboardModel";

export default function RevenueChart({
  data,
}: {
  data: ReturnType<typeof revenueSeries>;
}) {
  return (
    <div className="mt-5 h-64 min-w-0" aria-label="Daily revenue chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart
          data={data}
          margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
          accessibilityLayer
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={30}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={45}
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
            contentStyle={{ borderRadius: 12, fontSize: 13 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#7c3aed"
            fill="#ede9fe"
            strokeWidth={2.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
