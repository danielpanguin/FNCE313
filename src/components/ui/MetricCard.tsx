"use client";

interface TooltipRow {
  label: string;
  value: string;
}

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  tooltip?: {
    description: string;
    rows?: TooltipRow[];
  };
}

export default function MetricCard({ label, value, sub, accent = "bg-blue-50", tooltip }: MetricCardProps) {
  return (
    <div className={`${accent} rounded-2xl p-5 flex flex-col gap-1 relative group`}>
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {tooltip && (
          <span className="text-gray-400 text-xs cursor-default">ⓘ</span>
        )}
      </div>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}

      {tooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 text-white rounded-xl p-3 text-xs shadow-xl
                        opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-10">
          <p className="text-gray-300 leading-relaxed mb-2">{tooltip.description}</p>
          {tooltip.rows && tooltip.rows.length > 0 && (
            <div className="border-t border-gray-700 pt-2 space-y-1">
              {tooltip.rows.map((row) => (
                <div key={row.label} className="flex justify-between gap-2">
                  <span className="text-gray-400">{row.label}</span>
                  <span className="font-mono font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
