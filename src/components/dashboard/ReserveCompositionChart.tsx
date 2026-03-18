"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ReserveComposition } from "@/types/dashboard";
import Card from "@/components/ui/Card";

interface Props {
  reserves: ReserveComposition;
}

const SLICES = [
  { key: "treasuries" as const, name: "US Treasuries", color: "#3B82F6" },
  { key: "cash" as const, name: "Cash", color: "#10B981" },
  { key: "corporateBonds" as const, name: "Corp Bonds", color: "#F59E0B" },
  { key: "other" as const, name: "Other", color: "#8B5CF6" },
];

export default function ReserveCompositionChart({ reserves }: Props) {
  const data = SLICES.map(({ key, name, color }) => ({
    name,
    value: parseFloat(reserves[key].toFixed(1)),
    color,
  }));

  return (
    <Card title="Reserve Breakdown">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={2}
            label={({ value }) => `${value.toFixed(1)}%`}
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v: unknown) => `${Number(v).toFixed(1)}%`} contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
