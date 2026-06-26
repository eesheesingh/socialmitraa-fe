import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Search, Menu, X, LogOut, ChevronRight, Shield } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

type LayoutVariant = "default" | "admin";

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  roleLabel: string;
  variant?: LayoutVariant;
}

export default function DashboardLayout({
  children,
  navItems,
  activeTab,
  onTabChange,
  title,
  subtitle,
  actions,
  roleLabel,
  variant = "default",
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = variant === "admin";
  const accent = isAdmin ? "#4338CA" : "var(--blue)";
  const activeBg = isAdmin ? "#E0E7FF" : "#EBF1FD";

  const activeItem = navItems.find((item) => item.id === activeTab) ?? navItems[0];
  const ActiveIcon = activeItem?.icon;

  return (
    <div className="dash-page min-h-screen flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`dash-sidebar transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="dash-sidebar-header">
          <img src="/logo.png" alt="Social Mitraa" className="h-8 w-auto" />
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors ml-auto"
            style={{ color: "#64748B" }}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="rounded-xl p-4" style={{ background: isAdmin ? "#F0F4FF" : "#F8FAFF", border: "1px solid #E8E4DE" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: accent }}>
              {isAdmin && <Shield size={10} />} {roleLabel}
            </p>
            <p className="text-sm font-semibold truncate" style={{ color: "#1E293B" }}>
              {user?.name ?? "User"}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: "#64748B" }}>
              {user?.email ?? ""}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeTab;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileOpen(false);
                }}
                className={isActive ? "dash-nav-item-active w-[calc(100%-24px)]" : "dash-nav-item w-[calc(100%-24px)]"}
                style={isActive ? { "--dash-active-bg": activeBg, "--dash-active-color": accent } as React.CSSProperties : undefined}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "#E8E4DE" }}>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ color: "#64748B" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FEF2F2";
              e.currentTarget.style.color = "#DC2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#64748B";
            }}
          >
            <LogOut className="w-[18px] h-[18px]" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-[260px] min-w-0">
        {/* Header */}
        <header className="dash-header">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white transition-colors"
              style={{ color: "#64748B" }}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                {ActiveIcon && (
                  <span style={{ color: accent }}>
                    <ActiveIcon className="w-5 h-5" />
                  </span>
                )}
                <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                  {title}
                </h1>
              </div>
              {subtitle && (
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 dash-search px-3 py-2">
              <Search className="w-4 h-4" style={{ color: "#94A3B8" }} />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-40"
                style={{ color: "#1E293B" }}
              />
            </div>
            <button className="relative p-2 rounded-xl bg-white border" style={{ borderColor: "#E8E4DE", color: "#64748B" }}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
            {actions}
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
