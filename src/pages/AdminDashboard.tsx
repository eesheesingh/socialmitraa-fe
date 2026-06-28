import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import DashboardLayout from "@/components/DashboardLayout";
import { LoadingState } from "@/components/DashboardStates";
import {
  LayoutDashboard, Users, Megaphone, Settings, Shield,
  Building2, UserCircle, CreditCard, BarChart3, TrendingUp,
  IndianRupee, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, ArrowUpRight, ArrowDownRight,
  Minus, Star, Crown, Filter, Percent, Clock,
} from "lucide-react";

type AdminTab = "overview" | "users" | "payments" | "campaigns" | "subscriptions" | "revenue" | "activity" | "settings";

const fmt = (n: number) => n?.toLocaleString("en-IN") ?? "0";
const fmtRs = (n: number) => `Rs.${fmt(Math.round(n * 100) / 100)}`;

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color }: any) {
  return (
    <div className="dash-stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={`dash-icon-circle dash-icon-circle-${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`dash-badge ${
            trend === "up" ? "dash-badge-green" :
            trend === "down" ? "dash-badge-red" : "dash-badge-slate"
          }`}>
            {trend === "up" ? <ArrowUpRight size={10} className="mr-1" /> : trend === "down" ? <ArrowDownRight size={10} className="mr-1" /> : <Minus size={10} className="mr-1" />}
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: "#64748B" }}>{title}</p>
      {subtitle && <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{subtitle}</p>}
    </div>
  );
}

function MiniChart({ data, color = "#5B8DEF" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 120, h = 40;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");

  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - ((data[data.length - 1] - min) / range) * h} r="3" fill={color} />
    </svg>
  );
}

function SectionCard({ title, icon: Icon, children, action, accent = "var(--blue)" }: { title: string; icon?: any; children: React.ReactNode; action?: React.ReactNode; accent?: string }) {
  return (
    <div className="dash-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold flex items-center gap-2" style={{ color: "#1E293B" }}>
          {Icon && <Icon size={16} style={{ color: accent }} />}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function AdminBanner({ overview }: { overview: any }) {
  return (
    <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1E293B 0%, #334155 50%, #4338CA 100%)" }}>
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3" style={{ background: "rgba(255,255,255,0.15)" }}>
            <Shield size={12} /> Super Admin Command Center
          </div>
          <h2 className="text-xl md:text-2xl font-bold">Platform Control Center</h2>
          <p className="text-sm mt-1 opacity-80">Monitor users, campaigns, revenue, and system health in one place.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
            <p className="text-xl font-bold">{overview?.users.total ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-80">Users</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
            <p className="text-xl font-bold">{overview?.campaigns.total ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-80">Campaigns</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
            <p className="text-xl font-bold">{overview?.payments.inEscrow ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-80">In Escrow</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const navItems = [
  { id: "overview" as AdminTab, label: "Overview", icon: LayoutDashboard },
  { id: "users" as AdminTab, label: "Users", icon: Users },
  { id: "payments" as AdminTab, label: "Payments", icon: CreditCard },
  { id: "campaigns" as AdminTab, label: "Campaigns", icon: Megaphone },
  { id: "subscriptions" as AdminTab, label: "Subscriptions", icon: Crown },
  { id: "revenue" as AdminTab, label: "Revenue", icon: BarChart3 },
  { id: "activity" as AdminTab, label: "Activity", icon: TrendingUp },
  { id: "settings" as AdminTab, label: "Settings", icon: Settings },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: overview } = useQuery<any>({ queryKey: ["admin", "overview"], queryFn: () => apiClient.get("/admin/overview"), enabled: isAuthenticated && !isLoading && isAdmin, refetchInterval: 30000 });
  const { data: growth } = useQuery<any>({ queryKey: ["admin", "growth"], queryFn: () => apiClient.get("/admin/monthly-growth"), enabled: isAuthenticated && !isLoading && isAdmin });
  const { data: allUsers } = useQuery<any>({ queryKey: ["admin", "users", { role: userRoleFilter !== "all" ? userRoleFilter : undefined, page: userPage, limit: 50 }], queryFn: () => apiClient.get(`/admin/users?role=${userRoleFilter !== "all" ? userRoleFilter : ""}&page=${userPage}&limit=50`), enabled: isAuthenticated && !isLoading && isAdmin && activeTab === "users" });
  const { data: allPayments } = useQuery<any>({ queryKey: ["admin", "payments"], queryFn: () => apiClient.get("/admin/payments"), enabled: isAuthenticated && !isLoading && isAdmin && activeTab === "payments" });
  const { data: allCampaigns } = useQuery<any>({ queryKey: ["admin", "campaigns"], queryFn: () => apiClient.get("/admin/campaigns"), enabled: isAuthenticated && !isLoading && isAdmin && activeTab === "campaigns" });
  const { data: subscriptions } = useQuery<any>({ queryKey: ["admin", "subscriptions"], queryFn: () => apiClient.get("/admin/subscriptions"), enabled: isAuthenticated && !isLoading && isAdmin && activeTab === "subscriptions" });
  const { data: revenueBreakdown } = useQuery<any>({ queryKey: ["admin", "revenue"], queryFn: () => apiClient.get("/admin/revenue-breakdown"), enabled: isAuthenticated && !isLoading && isAdmin && activeTab === "revenue" });
  const { data: topCreators } = useQuery<any>({ queryKey: ["admin", "top-creators"], queryFn: () => apiClient.get("/admin/top-creators"), enabled: isAuthenticated && !isLoading && isAdmin && activeTab === "overview" });
  const { data: recentActivity } = useQuery<any>({ queryKey: ["admin", "activity"], queryFn: () => apiClient.get("/admin/recent-activity"), enabled: isAuthenticated && !isLoading && isAdmin && activeTab === "activity" });

  const updateRole = useMutation<any, Error, { userId: number; role: string }>({ mutationFn: ({ userId, role }) => apiClient.put(`/admin/users/${userId}/role`, { role }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "users"] }); queryClient.invalidateQueries({ queryKey: ["admin", "overview"] }); } });
  const moderateCampaign = useMutation<any, Error, { campaignId: number; action: "approve" | "reject" | "pause" }>({ mutationFn: ({ campaignId, action }) => apiClient.post(`/admin/campaigns/${campaignId}/moderate`, { action }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] }); queryClient.invalidateQueries({ queryKey: ["admin", "overview"] }); } });
  const forceDowngrade = useMutation<any, Error, { userId: number; userType: "brand" | "creator" }>({ mutationFn: ({ userId, userType }) => apiClient.post(`/admin/users/${userId}/downgrade`, { userType }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] }); queryClient.invalidateQueries({ queryKey: ["admin", "overview"] }); } });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login");
    if (!isLoading && isAuthenticated && !isAdmin) navigate("/");
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  const handleRoleChange = async (userId: number, role: string) => {
    try { await updateRole.mutateAsync({ userId, role: role as any }); } catch (e) { console.error(e); }
  };

  const handleCampaignAction = async (campaignId: number, action: "approve" | "reject" | "pause") => {
    try { await moderateCampaign.mutateAsync({ campaignId, action }); } catch (e) { console.error(e); }
  };

  const handleForceDowngrade = async (userId: number, userType: "brand" | "creator") => {
    if (!window.confirm(`Force downgrade this ${userType} to free plan?`)) return;
    try { await forceDowngrade.mutateAsync({ userId, userType }); } catch (e) { console.error(e); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}><div className="w-8 h-8 border-2 border-[#5B8DEF] border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated || !isAdmin) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
      <div className="dash-card p-8 text-center max-w-md">
        <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: "#DC2626" }} />
        <h2 className="font-semibold text-xl mb-2" style={{ color: "#1E293B" }}>Access Denied</h2>
        <p className="text-sm mb-6" style={{ color: "#64748B" }}>Super Admin privileges required.</p>
        <button onClick={() => navigate("/")} className="dash-btn-primary">Go Home</button>
      </div>
    </div>
  );

  const growthData = growth?.monthlyData ?? [];
  const revNumbers = growthData.map(d => d.revenue);
  const userNumbers = growthData.map(d => d.newUsers);

  const titles: Record<AdminTab, string> = {
    overview: "Platform Overview",
    users: "User Management",
    payments: "Payment Oversight",
    campaigns: "Campaign Moderation",
    subscriptions: "Subscription Management",
    revenue: "Revenue Analytics",
    activity: "Recent Activity",
    settings: "Platform Settings",
  };

  const subtitles: Record<AdminTab, string> = {
    overview: "Real-time platform performance metrics",
    users: `Total users: ${overview?.users.total ?? 0}`,
    payments: `Total revenue: ${fmtRs(overview?.revenue.total ?? 0)}`,
    campaigns: `Total campaigns: ${overview?.campaigns.total ?? 0}`,
    subscriptions: "Active subscriptions monitoring",
    revenue: `GST collected: ${fmtRs(overview?.revenue.gstCollected ?? 0)}`,
    activity: "Latest platform events",
    settings: "Configure platform parameters",
  };

  const filteredUsers = allUsers?.filter((u) =>
    [u.name, u.email, u.role].some((field) =>
      (field ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as AdminTab)}
      title={titles[activeTab]}
      subtitle={subtitles[activeTab]}
      roleLabel="Super Admin"
      variant="admin"
      actions={
        <div className="flex items-center gap-3">
          {overview?.pending && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
              <AlertTriangle size={14} style={{ color: "#B45309" }} />
              <span className="text-xs font-semibold" style={{ color: "#B45309" }}>
                {(overview.pending.applications + overview.pending.barterDeals + overview.pending.negotiations)} pending
              </span>
            </div>
          )}
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "overview"] })} className="dash-btn-secondary">
            <RefreshCw size={14} />
          </button>
        </div>
      }
    >
      {/* ─── OVERVIEW ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-up">
          {overview === undefined ? <LoadingState /> : (
            <>
              <AdminBanner overview={overview} />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Users" value={overview?.users.total ?? 0} subtitle={`+${overview?.users.newThisMonth ?? 0} this month`} icon={Users} color="indigo" trend="up" trendValue={`${growth?.userGrowth ?? 0}% MoM`} />
                <StatCard title="Total Revenue" value={fmtRs(overview?.revenue.total ?? 0)} subtitle={`GST: ${fmtRs(overview?.revenue.gstCollected ?? 0)}`} icon={IndianRupee} color="slate" trend="up" trendValue={`${growth?.revenueGrowth ?? 0}% MoM`} />
                <StatCard title="Active Campaigns" value={overview?.campaigns.active ?? 0} subtitle={`${overview?.campaigns.completed ?? 0} completed`} icon={Megaphone} color="blue" />
                <StatCard title="Active Subs" value={(overview?.subscriptions.activeBrandSubs ?? 0) + (overview?.subscriptions.activeCreatorSubs ?? 0)} subtitle={`${overview?.subscriptions.failedPayments ?? 0} failed payments`} icon={Crown} color="rose" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Monthly Revenue" icon={TrendingUp} action={<MiniChart data={revNumbers.length > 1 ? revNumbers : [0, 0, 0, 0, 0, 0]} color="#16A34A" />}>
                  <div className="space-y-3">
                    {growthData.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs w-16" style={{ color: "#64748B" }}>{d.month}</span>
                        <div className="flex-1 rounded-full h-5 overflow-hidden" style={{ background: "#F1F5F9" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(5, (d.revenue / (Math.max(...growthData.map(x => x.revenue)) || 1)) * 100)}%`, background: "var(--blue)" }} />
                        </div>
                        <span className="text-xs font-semibold w-20 text-right" style={{ color: "#1E293B" }}>{fmtRs(d.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="New Users (Monthly)" icon={Users} action={<MiniChart data={userNumbers.length > 1 ? userNumbers : [0, 0, 0, 0, 0, 0]} color="#5B8DEF" />}>
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className="rounded-xl p-4 text-center" style={{ background: "#F8FAFF" }}>
                      <p className="text-lg font-bold" style={{ color: "var(--blue)" }}>{overview?.users.newBrandsThisMonth ?? 0}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>New Brands</p>
                    </div>
                    <div className="rounded-xl p-4 text-center" style={{ background: "#F0FDF4" }}>
                      <p className="text-lg font-bold" style={{ color: "#16A34A" }}>{overview?.users.newInfluencersThisMonth ?? 0}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>New Creators</p>
                    </div>
                    <div className="rounded-xl p-4 text-center" style={{ background: "#FAF5FF" }}>
                      <p className="text-lg font-bold" style={{ color: "#9333EA" }}>{overview?.users.newThisMonth ?? 0}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>Total New</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {growthData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span style={{ color: "#64748B" }}>{d.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold" style={{ color: "var(--blue)" }}>{d.newBrands} brands</span>
                          <span className="font-semibold" style={{ color: "#16A34A" }}>{d.newInfluencers} creators</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Pending Approvals" icon={AlertTriangle}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
                      <span className="text-sm" style={{ color: "#64748B" }}>Campaign Applications</span>
                      <span className="text-sm font-bold" style={{ color: "#1E293B" }}>{overview?.pending.applications ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
                      <span className="text-sm" style={{ color: "#64748B" }}>Open Barter Deals</span>
                      <span className="text-sm font-bold" style={{ color: "#1E293B" }}>{overview?.pending.barterDeals ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
                      <span className="text-sm" style={{ color: "#64748B" }}>Active Negotiations</span>
                      <span className="text-sm font-bold" style={{ color: "#1E293B" }}>{overview?.pending.negotiations ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
                      <span className="text-sm" style={{ color: "#DC2626" }}>Failed Subscription Payments</span>
                      <span className="text-sm font-bold" style={{ color: "#DC2626" }}>{overview?.subscriptions.failedPayments ?? 0}</span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Top Creators by Mitraa Score" icon={Star}>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {topCreators?.slice(0, 10).map((creator, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8FAFF] transition-colors">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))" }}>
                          {creator.user?.name?.charAt(0) ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "#1E293B" }}>{creator.user?.name ?? "Unknown"}</p>
                          <p className="text-xs" style={{ color: "#94A3B8" }}>{creator.profile?.niche ?? "General"}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-bold ${(creator.overallScore ?? 0) >= 750 ? "text-emerald-600" : (creator.overallScore ?? 0) >= 600 ? "text-[#5B8DEF]" : "text-amber-600"}`}>
                            {creator.overallScore ?? "—"}
                          </span>
                          <span className="text-xs ml-1" style={{ color: "#94A3B8" }}>/900</span>
                        </div>
                      </div>
                    ))}
                    {(!topCreators || topCreators.length === 0) && (
                      <p className="text-sm text-center py-4" style={{ color: "#94A3B8" }}>No scores calculated yet</p>
                    )}
                  </div>
                </SectionCard>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── USERS ─── */}
      {activeTab === "users" && (
        <div className="space-y-4 animate-fade-up">
          {allUsers === undefined && <LoadingState />}
          <div className="dash-card p-4 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 flex-1 dash-search">
              <Filter size={16} style={{ color: "#94A3B8" }} />
              <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 text-sm outline-none bg-transparent" style={{ color: "#1E293B" }} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {["all", "brand", "influencer", "admin"].map((r) => (
                <button key={r} onClick={() => { setUserRoleFilter(r); setUserPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${userRoleFilter === r ? "dash-badge-blue border-[#5B8DEF]" : "bg-white border-[#E8E4DE] text-[#64748B] hover:border-[#5B8DEF] hover:text-[#5B8DEF]"}`}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="dash-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full dash-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Subscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers?.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F8FAFF] transition-colors">
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))" }}>{u.name?.charAt(0) ?? "?"}</div>
                          <span className="font-medium" style={{ color: "#1E293B" }}>{u.name ?? "Unnamed"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`dash-badge ${
                          u.role === "admin" ? "dash-badge-red" :
                          u.role === "brand" ? "dash-badge-blue" :
                          u.role === "influencer" ? "dash-badge-green" :
                          "dash-badge-slate"
                        }`}>{u.role}</span>
                      </td>
                      <td style={{ color: "#64748B" }}>{u.email ?? "-"}</td>
                      <td style={{ color: "#64748B" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className="text-xs font-semibold" style={{ color: "#1E293B" }}>{u.subscription?.plan ?? "free"}</span>
                        {u.subscription?.status && <span className={`ml-1 text-xs ${u.subscription.status === "active" ? "text-emerald-500" : "text-amber-500"}`}>{u.subscription.status}</span>}
                      </td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="text-xs border rounded-lg px-2 py-1 bg-white outline-none"
                          style={{ borderColor: "#E8E4DE", color: "#1E293B" }}
                        >
                          <option value="user">User</option>
                          <option value="brand">Brand</option>
                          <option value="influencer">Influencer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── PAYMENTS ─── */}
      {activeTab === "payments" && (
        <div className="space-y-4 animate-fade-up">
          {allPayments === undefined && <LoadingState />}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="dash-card p-5 text-center">
              <p className="text-lg font-bold" style={{ color: "#1E293B" }}>{fmtRs(overview?.revenue.total ?? 0)}</p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>Total Revenue</p>
            </div>
            <div className="dash-card p-5 text-center">
              <p className="text-lg font-bold text-emerald-600">{fmtRs(overview?.revenue.gstCollected ?? 0)}</p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>GST Collected (18%)</p>
            </div>
            <div className="dash-card p-5 text-center">
              <p className="text-lg font-bold" style={{ color: "var(--blue)" }}>{overview?.payments.inEscrow ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>In Escrow</p>
            </div>
            <div className="dash-card p-5 text-center">
              <p className="text-lg font-bold" style={{ color: "#9333EA" }}>{overview?.payments.released ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>Released</p>
            </div>
          </div>

          <div className="dash-card p-4 flex items-center gap-3" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
            <Percent size={18} style={{ color: "#B45309" }} />
            <p className="text-sm" style={{ color: "#B45309" }}>All payments include 18% GST as per Indian tax regulations. GST is calculated on the subtotal and added at checkout.</p>
          </div>

          <div className="dash-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full dash-table">
                <thead><tr>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Subtotal</th>
                  <th>GST (18%)</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr></thead>
                <tbody>
                  {allPayments?.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F8FAFF] transition-colors">
                      <td className="font-mono text-xs" style={{ color: "#64748B" }}>#{p.id}</td>
                      <td className="font-semibold" style={{ color: "#1E293B" }}>Rs.{fmt(parseFloat(p.amount?.toString() ?? "0"))}</td>
                      <td style={{ color: "#64748B" }}>Rs.{fmt(parseFloat(p.subtotal?.toString() ?? p.amount?.toString() ?? "0"))}</td>
                      <td style={{ color: "#B45309" }}>Rs.{fmt(parseFloat(p.gstAmount?.toString() ?? "0"))}</td>
                      <td><span className={`dash-badge ${
                        p.status === "released" ? "dash-badge-green" :
                        p.status === "escrow" ? "dash-badge-blue" :
                        p.status === "refunded" ? "dash-badge-red" :
                        "dash-badge-slate"
                      }`}>{p.status}</span></td>
                      <td style={{ color: "#64748B" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── CAMPAIGNS ─── */}
      {activeTab === "campaigns" && (
        <div className="space-y-4 animate-fade-up">
          {allCampaigns === undefined && <LoadingState />}
          <div className="dash-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full dash-table">
                <thead><tr>
                  <th>Campaign</th>
                  <th>Niche</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {allCampaigns?.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8FAFF] transition-colors">
                      <td>
                        <p className="font-medium" style={{ color: "#1E293B" }}>{c.title}</p>
                        <p className="text-xs truncate max-w-xs" style={{ color: "#94A3B8" }}>{c.description}</p>
                      </td>
                      <td style={{ color: "#64748B" }}>{c.niche ?? "-"}</td>
                      <td className="font-semibold" style={{ color: "#1E293B" }}>Rs.{fmt(parseFloat(c.budget?.toString() ?? "0"))}</td>
                      <td><span className={`dash-badge ${
                        c.status === "active" ? "dash-badge-green" :
                        c.status === "paused" ? "dash-badge-amber" :
                        c.status === "completed" ? "dash-badge-blue" :
                        "dash-badge-slate"
                      }`}>{c.status}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          {c.status !== "active" && (
                            <button onClick={() => handleCampaignAction(c.id, "approve")} className="p-1.5 rounded-lg hover:bg-emerald-50" title="Approve" style={{ color: "#16A34A" }}><CheckCircle size={16} /></button>
                          )}
                          {c.status !== "paused" && (
                            <button onClick={() => handleCampaignAction(c.id, "pause")} className="p-1.5 rounded-lg hover:bg-amber-50" title="Pause" style={{ color: "#B45309" }}><Clock size={16} /></button>
                          )}
                          <button onClick={() => handleCampaignAction(c.id, "reject")} className="p-1.5 rounded-lg hover:bg-red-50" title="Reject" style={{ color: "#DC2626" }}><XCircle size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUBSCRIPTIONS ─── */}
      {activeTab === "subscriptions" && (
        <div className="space-y-6 animate-fade-up">
          {subscriptions === undefined && <LoadingState />}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="dash-card p-5 text-center">
              <p className="text-lg font-bold" style={{ color: "var(--blue)" }}>{overview?.subscriptions.activeBrandSubs ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>Active Brand Subs</p>
            </div>
            <div className="dash-card p-5 text-center">
              <p className="text-lg font-bold text-emerald-600">{overview?.subscriptions.activeCreatorSubs ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>Active Creator Subs</p>
            </div>
            <div className="dash-card p-5 text-center">
              <p className="text-lg font-bold" style={{ color: "#DC2626" }}>{overview?.subscriptions.failedPayments ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>Failed Payments</p>
            </div>
          </div>

          <SectionCard title="Brand Subscriptions" icon={Building2}>
            <div className="overflow-x-auto">
              <table className="w-full dash-table">
                <thead><tr>
                  <th>Brand</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Last Payment</th>
                  <th>Failed</th>
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {subscriptions?.brandSubs.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F8FAFF] transition-colors">
                      <td className="font-medium" style={{ color: "#1E293B" }}>{s.user?.name ?? "Unknown"}</td>
                      <td><span className="dash-badge dash-badge-blue">{s.plan}</span></td>
                      <td><span className={`text-xs font-semibold ${s.status === "active" ? "text-emerald-600" : s.status === "expired" ? "text-red-500" : "text-amber-500"}`}>{s.status}</span></td>
                      <td style={{ color: "#64748B" }}>{s.lastPaymentDate ? new Date(s.lastPaymentDate).toLocaleDateString() : "Never"}</td>
                      <td>
                        {s.failedPaymentCount && s.failedPaymentCount > 0 ? (
                          <span className="text-red-600 font-semibold">{s.failedPaymentCount}/3</span>
                        ) : <span style={{ color: "#94A3B8" }}>-</span>}
                      </td>
                      <td>
                        <button onClick={() => handleForceDowngrade(s.brandId, "brand")} className="text-xs font-semibold px-2 py-1 rounded-lg hover:bg-red-50" style={{ color: "#DC2626" }}>Downgrade</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Creator Subscriptions" icon={UserCircle}>
            <div className="overflow-x-auto">
              <table className="w-full dash-table">
                <thead><tr>
                  <th>Creator</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Last Payment</th>
                  <th>Failed</th>
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {subscriptions?.creatorSubs.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F8FAFF] transition-colors">
                      <td className="font-medium" style={{ color: "#1E293B" }}>{s.user?.name ?? "Unknown"}</td>
                      <td><span className="dash-badge dash-badge-green">{s.plan}</span></td>
                      <td><span className={`text-xs font-semibold ${s.status === "active" ? "text-emerald-600" : s.status === "expired" ? "text-red-500" : "text-amber-500"}`}>{s.status}</span></td>
                      <td style={{ color: "#64748B" }}>{s.lastPaymentDate ? new Date(s.lastPaymentDate).toLocaleDateString() : "Never"}</td>
                      <td>
                        {s.failedPaymentCount && s.failedPaymentCount > 0 ? (
                          <span className="text-red-600 font-semibold">{s.failedPaymentCount}/3</span>
                        ) : <span style={{ color: "#94A3B8" }}>-</span>}
                      </td>
                      <td>
                        <button onClick={() => handleForceDowngrade(s.creatorId, "creator")} className="text-xs font-semibold px-2 py-1 rounded-lg hover:bg-red-50" style={{ color: "#DC2626" }}>Downgrade</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ─── REVENUE ─── */}
      {activeTab === "revenue" && (
        <div className="space-y-6 animate-fade-up">
          {revenueBreakdown === undefined && <LoadingState />}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {revenueBreakdown?.byType.map((item, i) => (
              <div key={i} className="dash-card p-5">
                <p className="text-xs uppercase tracking-wider" style={{ color: "#64748B" }}>{item.feeType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                <p className="text-lg font-bold mt-1" style={{ color: "#1E293B" }}>{fmtRs(item.total)}</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>{item.count} transactions</p>
              </div>
            ))}
          </div>

          <SectionCard title="Monthly Revenue + GST" icon={BarChart3}>
            <div className="space-y-3">
              {revenueBreakdown?.monthlyRevenue.map((m, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs w-16" style={{ color: "#64748B" }}>{m.month}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 rounded-full h-6 overflow-hidden relative" style={{ background: "#F1F5F9" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(5, (m.revenue / Math.max(...(revenueBreakdown?.monthlyRevenue || []).map((x: any) => x.revenue || 1), 1)) * 100)}%`, background: "var(--blue)" }} />
                    </div>
                    <span className="text-xs font-semibold w-20 text-right" style={{ color: "#1E293B" }}>{fmtRs(m.revenue)}</span>
                    <span className="text-xs w-16" style={{ color: "#B45309" }}>GST: {fmtRs(m.gst)}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="dash-card p-6" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
            <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ color: "#B45309" }}><Percent size={16} /> GST Compliance</h3>
            <p className="text-sm" style={{ color: "#B45309" }}>All payments processed through the platform include 18% GST as per Indian tax regulations. Total GST collected to date: <strong>{fmtRs(overview?.revenue.gstCollected ?? 0)}</strong></p>
          </div>
        </div>
      )}

      {/* ─── ACTIVITY ─── */}
      {activeTab === "activity" && (
        <div className="space-y-6 animate-fade-up">
          {recentActivity === undefined && <LoadingState />}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SectionCard title="Recent Signups" icon={Users}>
              <div className="space-y-2">
                {recentActivity?.recentUsers.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8FAFF]">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))" }}>{u.name?.charAt(0) ?? "?"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1E293B" }}>{u.name ?? "Unnamed"}</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{u.role} • {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Recent Payments" icon={CreditCard}>
              <div className="space-y-2">
                {recentActivity?.recentPayments.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8FAFF]">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: p.status === "released" ? "#DCFCE7" : "#EBF1FD" }}>
                      <IndianRupee size={14} style={{ color: p.status === "released" ? "#16A34A" : "var(--blue)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "#1E293B" }}>Rs.{fmt(parseFloat(p.amount?.toString() ?? "0"))}</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{p.status} • {new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Recent Campaigns" icon={Megaphone}>
              <div className="space-y-2">
                {recentActivity?.recentCampaigns.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8FAFF]">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#F3E8FF", color: "#9333EA" }}>{c.title?.charAt(0) ?? "?"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1E293B" }}>{c.title}</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{c.niche ?? "General"} • {new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ─── SETTINGS ─── */}
      {activeTab === "settings" && (
        <div className="space-y-6 animate-fade-up">
          <SectionCard title="GST Configuration" icon={Percent}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl p-4" style={{ background: "#F8FAFF" }}>
                <p className="text-sm" style={{ color: "#64748B" }}>GST Rate</p>
                <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>18%</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>Applied to all payments automatically</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#F0FDF4" }}>
                <p className="text-sm" style={{ color: "#64748B" }}>Total GST Collected</p>
                <p className="text-2xl font-bold text-emerald-600">{fmtRs(overview?.revenue.gstCollected ?? 0)}</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>Lifetime collection</p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-xl border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
              <p className="text-sm" style={{ color: "#B45309" }}>Disclaimer shown to users: &quot;All prices are exclusive of 18% GST. GST will be added at checkout.&quot;</p>
            </div>
          </SectionCard>

          <SectionCard title="Subscription Settings" icon={Shield}>
            <div className="space-y-3">
              {[
                { label: "Auto-Downgrade", desc: "Downgrade after 3 failed payment attempts" },
                { label: "Grace Period", desc: "7 days grace period before downgrade" },
                { label: "Payment Reminders", desc: "Sent on each failed payment + before downgrade" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "#64748B" }}>{item.desc}</p>
                  </div>
                  <span className="dash-badge dash-badge-green">Active</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </DashboardLayout>
  );
}
