"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import DashboardPage from "@/components/dashboard/DashboardPage";
import StressPage from "@/components/pages/StressPage";
import YieldPolicyPage from "@/components/pages/YieldPolicyPage";
import BuyerLandscapePage from "@/components/pages/BuyerLandscapePage";
import ModelConfigPage from "@/components/pages/ModelConfigPage";

type Page = "overview" | "stress" | "yield" | "buyers" | "models";

export default function App() {
  const [page, setPage]           = useState<Page>("overview");
  const [collapsed, setCollapsed] = useState(false);

  const marginLeft = collapsed ? "ml-16" : "ml-60";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        page={page}
        onNavigate={setPage}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div className={`flex-1 ${marginLeft} min-h-screen overflow-x-hidden transition-all duration-200`}>
        {page === "overview" && <DashboardPage />}
        {page === "stress"   && <StressPage />}
        {page === "yield"    && <YieldPolicyPage />}
        {page === "buyers"   && <BuyerLandscapePage />}
        {page === "models"   && <ModelConfigPage />}
      </div>
    </div>
  );
}
