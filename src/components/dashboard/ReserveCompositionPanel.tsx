"use client";

import type { ReserveComposition } from "@/types/dashboard";
import Card from "@/components/ui/Card";

interface Props {
  reserves: ReserveComposition;
  onChange: (field: keyof ReserveComposition, value: number) => void;
}

const FIELDS: { key: keyof ReserveComposition; label: string; color: string }[] = [
  { key: "treasuries", label: "US Treasuries", color: "#3B82F6" },
  { key: "cash", label: "Cash & Equivalents", color: "#10B981" },
  { key: "corporateBonds", label: "Corporate Bonds", color: "#F59E0B" },
  { key: "other", label: "Other Assets", color: "#8B5CF6" },
];

export default function ReserveCompositionPanel({ reserves, onChange }: Props) {
  const total = Object.values(reserves).reduce((a, b) => a + b, 0);

  return (
    <Card title="Reserve Composition">
      <div className="space-y-5">
        {FIELDS.map(({ key, label, color }) => (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={parseFloat(reserves[key].toFixed(1))}
                  onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
                  className="w-16 text-sm text-right border border-gray-200 rounded-md px-2 py-0.5 outline-none focus:border-blue-400 font-mono"
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={reserves[key]}
              onChange={(e) => onChange(key, parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: color }}
            />
          </div>
        ))}
      </div>
      <div className={`mt-4 text-xs font-mono font-semibold text-right ${Math.abs(total - 100) < 0.1 ? "text-green-600" : "text-red-500"}`}>
        Total: {total.toFixed(1)}%
      </div>
    </Card>
  );
}
