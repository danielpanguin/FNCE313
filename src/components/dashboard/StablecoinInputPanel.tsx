"use client";

import { useState } from "react";
import type { Scenario } from "@/types/dashboard";
import Card from "@/components/ui/Card";

interface Props {
  scenarios: Scenario[];
  activeScenarioId: string;
  onScenariosChange: (scenarios: Scenario[]) => void;
  onActiveChange: (id: string) => void;
}

export default function StablecoinInputPanel({
  scenarios,
  activeScenarioId,
  onScenariosChange,
  onActiveChange,
}: Props) {
  const [newLabel, setNewLabel] = useState("");
  const [newMarketCap, setNewMarketCap] = useState("");

  function updateScenario(id: string, field: keyof Scenario, value: string | number) {
    onScenariosChange(
      scenarios.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function addScenario() {
    const cap = parseFloat(newMarketCap);
    if (!newLabel.trim() || isNaN(cap) || cap <= 0) return;
    const id = `custom-${Date.now()}`;
    onScenariosChange([...scenarios, { id, label: newLabel.trim(), marketCapBillions: cap }]);
    onActiveChange(id);
    setNewLabel("");
    setNewMarketCap("");
  }

  function removeScenario(id: string) {
    if (scenarios.length <= 1) return;
    const next = scenarios.filter((s) => s.id !== id);
    onScenariosChange(next);
    if (activeScenarioId === id) onActiveChange(next[0].id);
  }

  return (
    <Card title="Stablecoin Demand Scenarios">
      <div className="space-y-2">
        {scenarios.map((s) => (
          <div
            key={s.id}
            onClick={() => onActiveChange(s.id)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
              activeScenarioId === s.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-100 hover:border-gray-300"
            }`}
          >
            <div className="flex-1 min-w-0">
              <input
                className="w-full text-sm font-medium bg-transparent outline-none truncate text-gray-800"
                value={s.label}
                onChange={(e) => updateScenario(s.id, "label", e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">$</span>
              <input
                type="number"
                min={0}
                className="w-24 text-sm text-right bg-transparent outline-none text-gray-800 font-mono"
                value={s.marketCapBillions}
                onChange={(e) => updateScenario(s.id, "marketCapBillions", parseFloat(e.target.value) || 0)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-gray-400">B</span>
            </div>
            {scenarios.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); removeScenario(s.id); }}
                className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add scenario */}
      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
          placeholder="Label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addScenario()}
        />
        <input
          type="number"
          min={0}
          className="w-28 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 font-mono"
          placeholder="Cap ($B)"
          value={newMarketCap}
          onChange={(e) => setNewMarketCap(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addScenario()}
        />
        <button
          onClick={addScenario}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Add
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-400">Click a row to set as active scenario for KPI cards.</p>
    </Card>
  );
}
