"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ScenarioMetrics } from "@/types/dashboard";
import Card from "@/components/ui/Card";
import { formatBillions } from "@/lib/calculations";

interface Props {
  data: ScenarioMetrics[];
  activeLabel: string;
}

const fmt = (v: unknown) => formatBillions(Number(v));

export default function TreasuryDemandChart({ data, activeLabel }: Props) {
  return (
    <Card title="Reserve Allocation by Scenario">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="scenarioLabel"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => (v === activeLabel ? `★ ${v}` : v)}
          />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={72} />
          <Tooltip formatter={fmt} contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="treasuryDemandBillions" name="US Treasuries" stackId="a" fill="#3B82F6" radius={[0,0,0,0]} />
          <Bar dataKey="cashHoldingsBillions" name="Cash" stackId="a" fill="#10B981" />
          <Bar dataKey="corpBondsBillions" name="Corp Bonds" stackId="a" fill="#F59E0B" />
          <Bar dataKey="otherBillions" name="Other" stackId="a" fill="#8B5CF6" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
