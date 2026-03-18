"use client";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export default function MetricCard({ label, value, sub, accent = "bg-blue-50" }: MetricCardProps) {
  return (
    <div className={`${accent} rounded-2xl p-5 flex flex-col gap-1`}>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}
