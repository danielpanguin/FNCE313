"use client";

type Page = "overview" | "stress" | "yield" | "buyers" | "models";

const NAV: { section: string; items: { id: Page; label: string; sub: string }[] }[] = [
  {
    section: "Analysis",
    items: [
      { id: "overview", label: "Dashboard",       sub: "Overview & Config"      },
      { id: "stress",   label: "Stress Testing",  sub: "Redemption Scenarios"   },
      { id: "yield",    label: "Yield Policy",    sub: "Pass-Through Simulator" },
      { id: "buyers",   label: "Buyer Landscape", sub: "Market Context"         },
    ],
  },
  {
    section: "Reference",
    items: [
      { id: "models", label: "Model Config", sub: "Parameters & Sources" },
    ],
  },
];

const ICONS: Record<Page, React.ReactNode> = {
  overview: (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  stress: (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  yield: (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  buyers: (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  ),
  models: (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.2.65.77 1.1 1.45 1.12H21a2 2 0 010 4h-.09c-.68.02-1.25.47-1.45 1.12z"/>
    </svg>
  ),
};

interface Props {
  page: Page;
  onNavigate: (p: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ page, onNavigate, collapsed, onToggle }: Props) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand + toggle */}
      <div className={`flex items-center border-b border-gray-100 h-16 px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <h2 className="text-gray-900 font-bold text-sm tracking-tight">StableFiscal</h2>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Treasury Impact Intelligence</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            {collapsed
              ? <path d="M9 18l6-6-6-6" />
              : <path d="M15 18l-6-6 6-6" />}
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ section, items }) => (
          <div key={section} className="mb-4">
            {!collapsed && (
              <p className="px-4 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {section}
              </p>
            )}
            {items.map((item) => {
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 transition-colors border-l-2 ${
                    collapsed ? "justify-center px-0 py-3" : "px-4 py-2.5"
                  } ${
                    active
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className={active ? "text-blue-600" : "text-gray-400"}>
                    {ICONS[item.id]}
                  </span>
                  {!collapsed && (
                    <div className="text-left overflow-hidden">
                      <p className="text-xs font-semibold leading-tight truncate">{item.label}</p>
                      <p className={`text-[10px] leading-tight mt-0.5 truncate ${active ? "text-blue-400" : "text-gray-400"}`}>
                        {item.sub}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            FNCE313 · SMU<br />
            Ahmed &amp; Aldasoro (BIS) · De la Horra et al.
          </p>
        </div>
      )}
    </aside>
  );
}
