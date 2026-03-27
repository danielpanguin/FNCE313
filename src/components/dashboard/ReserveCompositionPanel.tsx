"use client";

import type { ReserveComposition } from "@/types/dashboard";
import Card from "@/components/ui/Card";

interface Props {
  reserves: ReserveComposition;
  onChange: (value: number) => void;
}

export default function ReserveCompositionPanel({ reserves, onChange }: Props) {
  return (
    <Card title="Reserve Composition">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-700">Direct &amp; Indirect Treasury Holdings</p>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={Math.round(reserves.treasuryPct)}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              className="w-14 text-sm text-right border border-gray-200 rounded-md px-2 py-0.5 outline-none focus:border-blue-400 font-mono"
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={reserves.treasuryPct}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "#3B82F6" }}
        />
        <p className="text-xs text-gray-400">
          Combined share of reserves held directly in Treasuries or indirectly via money market funds &amp; repo agreements
        </p>
      </div>
    </Card>
  );
}
