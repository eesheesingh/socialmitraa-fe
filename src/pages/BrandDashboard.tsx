import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import {
  LayoutDashboard, Megaphone, Users, Settings,
  Brain, Plus, Search, DollarSign,
  Target, CheckCircle2, CreditCard, Wallet,
  X, Gift, Package, Hash,
  TrendingUp, BarChart3, Percent,
  Bot, Globe, Shield, ExternalLink,
} from "lucide-react";
import ConsentModal from "@/components/ConsentModal";
import DashboardLayout from "@/components/DashboardLayout";
import { LoadingState, EmptyState } from "@/components/DashboardStates";

type Tab = "overview" | "campaigns" | "creators" | "matches" | "payments" | "barter" | "roi" | "affiliate" | "settings";

const navItems = [
  { id: "overview" as Tab, label: "Overview", icon: LayoutDashboard },
  { id: "campaigns" as Tab, label: "Campaigns", icon: Megaphone },
  { id: "creators" as Tab, label: "Find Creators", icon: Users },
  { id: "matches" as Tab, label: "AI Matches", icon: Brain },
  { id: "payments" as Tab, label: "Payments", icon: CreditCard },
  { id: "barter" as Tab, label: "Barter Deals", icon: Gift },
  { id: "roi" as Tab, label: "ROI Tracking", icon: TrendingUp },
  { id: "affiliate" as Tab, label: "Affiliate", icon: Percent },
  { id: "settings" as Tab, label: "Settings", icon: Settings },
];

export default function BrandDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, isBrand } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBarterModal, setShowBarterModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  const { data: profile } = trpc.brand.getProfile.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: myCampaigns } = trpc.campaign.myCampaigns.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: allInfluencers } = trpc.influencer.list.useQuery({}, { enabled: isAuthenticated && !isLoading });
  const { data: myRequirements } = trpc.match.myRequirements.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: myPayments } = trpc.payment.myPayments.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: myBarterDeals } = trpc.barter.myDeals.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: barterApplications } = trpc.barter.myDealApplications.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: consentStatus } = trpc.consent.checkStatus.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const createCampaign = trpc.campaign.create.useMutation();
  const createBarterDeal = trpc.barter.createDeal.useMutation();
  const updateBarterApp = trpc.barter.updateApplicationStatus.useMutation();
  const utils = trpc.useUtils();

  const [campForm, setCampForm] = useState({ title: "", description: "", requirements: "", budget: "", niche: "", location: "", creatorCount: "1" });
  const [barterForm, setBarterForm] = useState({
    productName: "", productDescription: "", productValue: "",
    contentType: [] as string[], deliverables: "",
    creatorCategories: [] as string[], minFollowers: "", instructions: "",
    slotsTotal: "1",
  });

  // ROI queries
  const { data: allCampaignsRoi } = trpc.roi.allCampaignsRoi.useQuery(undefined, { enabled: isAuthenticated && !isLoading });

  // Affiliate queries
  const { data: myAffiliatePrograms } = trpc.affiliate.myPrograms.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const createAffiliateProgram = trpc.affiliate.createProgram.useMutation();
  const updateAffiliateProgram = trpc.affiliate.updateProgram.useMutation();
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [affiliateForm, setAffiliateForm] = useState({
    programName: "", description: "", commissionType: "percentage" as "percentage" | "fixed",
    commissionRate: "", commissionAmount: "", productName: "", productValue: "",
    productUrl: "", cookieDuration: "30", minFollowers: "0", creatorCategories: [] as string[],
  });

  useEffect(() => {
    if (consentStatus && !consentStatus.hasAccepted && !consentChecked) {
      setShowConsent(true);
      setConsentChecked(true);
    }
  }, [consentStatus, consentChecked]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login");
    if (!isLoading && isAuthenticated && !isBrand) navigate("/onboarding");
  }, [isLoading, isAuthenticated, isBrand, navigate]);

  const handleCreateCampaign = async () => {
    try {
      await createCampaign.mutateAsync({
        title: campForm.title, description: campForm.description,
        requirements: campForm.requirements, budget: parseFloat(campForm.budget) || 0,
        niche: campForm.niche, location: campForm.location,
        creatorCount: parseInt(campForm.creatorCount) || 1,
      });
      setShowCreateModal(false);
      setCampForm({ title: "", description: "", requirements: "", budget: "", niche: "", location: "", creatorCount: "1" });
      utils.campaign.myCampaigns.invalidate();
    } catch (e) { console.error(e); }
  };

  const handleCreateBarter = async () => {
    try {
      await createBarterDeal.mutateAsync({
        productName: barterForm.productName,
        productDescription: barterForm.productDescription,
        productValue: parseFloat(barterForm.productValue) || undefined,
        contentType: barterForm.contentType,
        deliverables: barterForm.deliverables,
        creatorCategories: barterForm.creatorCategories,
        minFollowers: parseInt(barterForm.minFollowers) || undefined,
        instructions: barterForm.instructions,
        slotsTotal: parseInt(barterForm.slotsTotal) || 1,
      });
      setShowBarterModal(false);
      setBarterForm({ productName: "", productDescription: "", productValue: "", contentType: [], deliverables: "", creatorCategories: [], minFollowers: "", instructions: "", slotsTotal: "1" });
      utils.barter.myDeals.invalidate();
    } catch (e) { console.error(e); }
  };

  const handleUpdateBarterStatus = async (appId: number, status: "approved" | "rejected" | "shortlisted") => {
    try {
      await updateBarterApp.mutateAsync({ applicationId: appId, status });
      utils.barter.myDealApplications.invalidate();
    } catch (e) { console.error(e); }
  };

  const toggleContentType = (type: string) => {
    setBarterForm(p => ({
      ...p,
      contentType: p.contentType.includes(type) ? p.contentType.filter(t => t !== type) : [...p.contentType, type]
    }));
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}><div className="w-8 h-8 border-2 border-[#5B8DEF] border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated || !isBrand) return null;

  const activeCampaigns = myCampaigns?.filter((c) => c.status === "active") ?? [];
  const totalBudget = myCampaigns?.reduce((s, c) => s + parseFloat(c.budget?.toString() ?? "0"), 0) ?? 0;

  const quickLinks = [
    { label: "AI Negotiation", icon: Bot, path: "/negotiation" },
    { label: "Language Hub", icon: Globe, path: "/regional-hub" },
    { label: "Mitraa Scores", icon: Shield, path: "/mitraa-score" },
  ];

  const overviewStats = [
    { label: "Active Campaigns", value: activeCampaigns.length.toString(), icon: Megaphone, color: "blue" as const, change: "Live now" },
    { label: "Total Budget", value: `Rs.${(totalBudget / 100000).toFixed(1)}L`, icon: DollarSign, color: "green" as const, change: "All campaigns" },
    { label: "AI Requirements", value: (myRequirements?.length ?? 0).toString(), icon: Brain, color: "purple" as const, change: "Matching" },
    { label: "Barter Deals", value: (myBarterDeals?.length ?? 0).toString(), icon: Gift, color: "amber" as const, change: "Posted" },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as Tab)}
      title="Brand Dashboard"
      subtitle="Manage campaigns, creators, and partnerships"
      roleLabel="Brand"
      actions={
        activeTab === "campaigns" ? (
          <button onClick={() => setShowCreateModal(true)} className="dash-btn-primary">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        ) : activeTab === "barter" ? (
          <button onClick={() => setShowBarterModal(true)} className="dash-btn-primary">
            <Plus className="w-4 h-4" /> Post Barter Deal
          </button>
        ) : activeTab === "affiliate" ? (
          <button onClick={() => setShowAffiliateModal(true)} className="dash-btn-primary">
            <Plus className="w-4 h-4" /> Create Program
          </button>
        ) : null
      }
    >
      {showConsent && (
        <ConsentModal
          onAccepted={() => {
            setShowConsent(false);
            utils.consent.checkStatus.invalidate();
          }}
        />
      )}

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewStats.map((s) => (
              <div key={s.label} className="dash-stat-card">
                <div className="flex items-start justify-between mb-4">
                  <div className={`dash-icon-circle dash-icon-circle-${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#64748B" }}>{s.change}</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: "#64748B" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 dash-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold" style={{ color: "#1E293B" }}>Brand Tools</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {quickLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className="dash-card p-5 text-left hover:-translate-y-1 transition-transform"
                  >
                    <link.icon className="w-7 h-7 mb-3" style={{ color: "var(--blue)" }} />
                    <h4 className="font-semibold text-sm" style={{ color: "#1E293B" }}>{link.label}</h4>
                    <p className="text-xs mt-1" style={{ color: "#64748B" }}>Open tool</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="dash-card p-6">
              <h3 className="font-semibold mb-4" style={{ color: "#1E293B" }}>Profile Snapshot</h3>
              {profile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))" }}>
                      {profile.companyName?.[0] ?? user?.name?.[0] ?? "B"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#1E293B" }}>{profile.companyName}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>{profile.industry ?? "Brand"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={{ background: "#F8FAFF" }}>
                      <p className="text-lg font-bold" style={{ color: "var(--blue)" }}>{(myCampaigns?.length ?? 0).toString()}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>Campaigns</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "#F8FAFF" }}>
                      <p className="text-lg font-bold" style={{ color: "var(--blue)" }}>{(myBarterDeals?.length ?? 0).toString()}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>Barter Deals</p>
                    </div>
                  </div>
                </div>
              ) : (
                <LoadingState />
              )}
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGNS */}
      {activeTab === "campaigns" && (
        <div className="space-y-4 animate-fade-up">
          {myCampaigns === undefined ? (
            <LoadingState />
          ) : myCampaigns.length > 0 ? (
            myCampaigns.map((camp) => (
              <div key={camp.id} className="dash-card p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg" style={{ color: "#1E293B" }}>{camp.title}</h3>
                      {camp.niche && <span className="dash-badge dash-badge-blue">{camp.niche}</span>}
                      {camp.platform && <span className="dash-badge dash-badge-purple">{camp.platform}</span>}
                    </div>
                    <p className="text-sm mb-3" style={{ color: "#64748B" }}>{camp.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: "#64748B" }}>
                      {camp.location && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />{camp.location}</span>}
                      <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{camp.creatorCount} needed</span>
                    </div>
                  </div>
                  <div className="text-left md:text-right min-w-[140px]">
                    <p className="font-bold text-xl" style={{ color: "var(--blue)" }}>Rs.{parseFloat(camp.budget?.toString() ?? "0").toLocaleString()}</p>
                    <span className={`dash-badge mt-1 ${camp.status === "active" ? "dash-badge-green" : camp.status === "paused" ? "dash-badge-amber" : "dash-badge-slate"}`}>{camp.status}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="dash-card p-16 text-center animate-fade-up">
              <Megaphone className="w-12 h-12 mx-auto mb-4" style={{ color: "#CBD5E1" }} />
              <h3 className="font-semibold text-xl mb-2" style={{ color: "#1E293B" }}>No campaigns yet</h3>
              <p className="mb-6" style={{ color: "#64748B" }}>Create your first campaign to start collaborating.</p>
              <button onClick={() => setShowCreateModal(true)} className="dash-btn-primary mx-auto"><Plus className="w-4 h-4" /> Create Campaign</button>
            </div>
          )}
        </div>
      )}

      {/* CREATORS */}
      {activeTab === "creators" && (
        <div className="animate-fade-up">
          <div className="dash-card p-4 mb-6 flex items-center gap-3">
            <Search className="w-5 h-5" style={{ color: "#94A3B8" }} />
            <input type="text" placeholder="Search creators by name, niche, or location..." className="flex-1 bg-transparent text-sm focus:outline-none" style={{ color: "#1E293B" }} />
          </div>
          {allInfluencers === undefined ? (
            <LoadingState />
          ) : allInfluencers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allInfluencers.map((inf) => (
                <div key={inf.id} className="dash-card p-6 hover:-translate-y-1 transition-transform">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="dash-icon-circle dash-icon-circle-blue">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#1E293B" }}>{inf.displayName}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>{inf.niche}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-4" style={{ color: "#64748B" }}>
                    <span>{(inf.followerCount ?? 0).toLocaleString()} followers</span>
                    <span>{inf.engagementRate != null ? `${inf.engagementRate}%` : "—"} engagement</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 dash-btn-primary py-2 text-xs">Invite</button>
                    <button className="flex-1 dash-btn-secondary py-2 text-xs">View Profile</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No creators registered yet" description="Check back once creators join the platform." />
          )}
        </div>
      )}

      {/* AI MATCHES */}
      {activeTab === "matches" && (
        <div className="space-y-4 animate-fade-up">
          {myRequirements === undefined ? (
            <LoadingState />
          ) : myRequirements.length > 0 ? (
            myRequirements.map((req) => (
              <div key={req.id} className="dash-card p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg" style={{ color: "#1E293B" }}>{req.campaignTitle}</h3>
                      <span className={`dash-badge ${req.autoMatched ? "dash-badge-green" : "dash-badge-blue"}`}>{req.autoMatched ? "AI Matched" : "Matching..."}</span>
                    </div>
                    <p className="text-sm" style={{ color: "#64748B" }}>{req.campaignDescription}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {req.creatorCategories && (req.creatorCategories as string[]).slice(0, 5).map((c) => <span key={c} className="dash-badge dash-badge-blue">{c}</span>)}
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5" style={{ color: "#94A3B8" }} />
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No AI Requirements Yet" description="Create a campaign with detailed requirements to get AI-matched with the perfect creators." />
          )}
        </div>
      )}

      {/* PAYMENTS */}
      {activeTab === "payments" && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total Spent", value: `Rs.${(myPayments?.reduce((s, p) => s + parseFloat(p.amount?.toString() ?? "0"), 0) ?? 0).toLocaleString()}`, icon: Wallet, color: "blue" as const },
              { label: "In Escrow", value: (myPayments?.filter((p) => p.status === "escrow")?.length ?? 0).toString(), icon: Target, color: "amber" as const },
              { label: "Released", value: (myPayments?.filter((p) => p.status === "released")?.length ?? 0).toString(), icon: CheckCircle2, color: "green" as const },
            ].map((s) => (
              <div key={s.label} className="dash-stat-card">
                <div className={`dash-icon-circle dash-icon-circle-${s.color} mb-4`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: "#64748B" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BARTER DEALS */}
      {activeTab === "barter" && (
        <div className="space-y-6 animate-fade-up">
          <div>
            <h3 className="font-semibold text-lg mb-4" style={{ color: "#1E293B" }}>My Barter Deals</h3>
            {myBarterDeals && myBarterDeals.length > 0 ? (
              <div className="space-y-4">
                {myBarterDeals.map((deal) => (
                  <div key={deal.id} className="dash-card p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="dash-icon-circle dash-icon-circle-blue">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold" style={{ color: "#1E293B" }}>{deal.productName}</h4>
                          <p className="text-sm" style={{ color: "#64748B" }}>{deal.productDescription}</p>
                        </div>
                      </div>
                      <span className={`dash-badge ${deal.status === "open" ? "dash-badge-green" : deal.status === "in_progress" ? "dash-badge-blue" : "dash-badge-slate"}`}>{deal.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {deal.contentType && (deal.contentType as string[]).map((t) => (
                        <span key={t} className="dash-badge dash-badge-blue">{t}</span>
                      ))}
                      <span className="dash-badge dash-badge-amber flex items-center gap-1">
                        <Hash className="w-3 h-3" />{deal.slotsFilled}/{deal.slotsTotal} slots
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dash-card p-12 text-center">
                <Gift className="w-12 h-12 mx-auto mb-4" style={{ color: "#CBD5E1" }} />
                <p style={{ color: "#64748B" }}>No barter deals yet. Create your first!</p>
              </div>
            )}
          </div>

          {barterApplications && barterApplications.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-4" style={{ color: "#1E293B" }}>Applications Received</h3>
              <div className="space-y-4">
                {barterApplications.map((app: any) => (
                  <div key={app.id} className="dash-card p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "#1E293B" }}>
                          {app.influencer?.displayName ?? "Creator"} applied for {app.deal?.productName}
                        </p>
                        {app.message && <p className="text-sm mt-1" style={{ color: "#64748B" }}>{app.message}</p>}
                        <span className={`dash-badge mt-2 ${app.status === "applied" ? "dash-badge-blue" : app.status === "approved" ? "dash-badge-green" : app.status === "rejected" ? "dash-badge-red" : "dash-badge-amber"}`}>{app.status}</span>
                      </div>
                      <div className="flex gap-2">
                        {app.status === "applied" && (
                          <>
                            <button onClick={() => handleUpdateBarterStatus(app.id, "approved")} className="dash-btn-primary text-xs py-2 px-3">Approve</button>
                            <button onClick={() => handleUpdateBarterStatus(app.id, "rejected")} className="dash-btn-secondary text-xs py-2 px-3" style={{ color: "#DC2626" }}>Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ROI TRACKING */}
      {activeTab === "roi" && (
        <div className="space-y-6 animate-fade-up">
          {allCampaignsRoi === undefined ? (
            <LoadingState />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Spend", value: `Rs.${(allCampaignsRoi.reduce((s, c) => s + c.totalSpend, 0)).toLocaleString()}`, icon: Wallet, color: "blue" as const },
                  { label: "Total Revenue", value: `Rs.${(allCampaignsRoi.reduce((s, c) => s + c.totalRevenue, 0)).toLocaleString()}`, icon: DollarSign, color: "green" as const },
                  { label: "Total Clicks", value: (allCampaignsRoi.reduce((s, c) => s + c.totalClicks, 0)).toLocaleString(), icon: TrendingUp, color: "purple" as const },
                  { label: "Avg ROI", value: `${(allCampaignsRoi.length > 0 ? allCampaignsRoi.reduce((s, c) => s + c.roi, 0) / allCampaignsRoi.length : 0).toFixed(1)}%`, icon: BarChart3, color: "amber" as const },
                ].map((s) => (
                  <div key={s.label} className="dash-stat-card">
                    <div className={`dash-icon-circle dash-icon-circle-${s.color} mb-4`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>{s.value}</p>
                    <p className="text-xs mt-1" style={{ color: "#64748B" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4" style={{ color: "#1E293B" }}>Campaign ROI Breakdown</h3>
                {allCampaignsRoi.length > 0 ? (
                  <div className="space-y-4">
                    {allCampaignsRoi.map((camp) => (
                      <div key={camp.campaignId} className="dash-card p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold" style={{ color: "#1E293B" }}>{camp.campaignTitle}</h4>
                              <span className={`dash-badge ${camp.status === "active" ? "dash-badge-green" : "dash-badge-slate"}`}>{camp.status}</span>
                            </div>
                            <p className="text-xs" style={{ color: "#64748B" }}>{camp.trackingLinks} tracking links</p>
                          </div>
                          <p className={`font-bold text-xl ${camp.roi >= 0 ? "text-green-600" : "text-red-600"}`}>{camp.roi >= 0 ? "+" : ""}{camp.roi}% ROI</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
                            <p className="font-bold text-sm" style={{ color: "#1E293B" }}>Rs.{camp.totalSpend.toLocaleString()}</p>
                            <p className="text-xs" style={{ color: "#64748B" }}>Spend</p>
                          </div>
                          <div className="p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
                            <p className="font-bold text-sm" style={{ color: "#1E293B" }}>Rs.{camp.totalRevenue.toLocaleString()}</p>
                            <p className="text-xs" style={{ color: "#64748B" }}>Revenue</p>
                          </div>
                          <div className="p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
                            <p className="font-bold text-sm" style={{ color: "#1E293B" }}>{camp.totalClicks.toLocaleString()}</p>
                            <p className="text-xs" style={{ color: "#64748B" }}>Clicks</p>
                          </div>
                          <div className="p-3 rounded-xl" style={{ background: "#F8FAFF" }}>
                            <p className="font-bold text-sm" style={{ color: "#1E293B" }}>{camp.totalConversions}</p>
                            <p className="text-xs" style={{ color: "#64748B" }}>Conversions</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dash-card p-16 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4" style={{ color: "#CBD5E1" }} />
                    <h3 className="font-semibold text-lg mb-2" style={{ color: "#1E293B" }}>No ROI Data Yet</h3>
                    <p className="text-sm mb-4" style={{ color: "#64748B" }}>Create tracking links for your campaigns to start measuring ROI.</p>
                    <button onClick={() => setActiveTab("campaigns")} className="dash-btn-primary">Go to Campaigns</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* AFFILIATE */}
      {activeTab === "affiliate" && (
        <div className="space-y-6 animate-fade-up">
          {myAffiliatePrograms === undefined ? (
            <LoadingState />
          ) : myAffiliatePrograms.length > 0 ? (
            <div className="space-y-4">
              {myAffiliatePrograms.map((prog) => (
                <div key={prog.id} className="dash-card p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold" style={{ color: "#1E293B" }}>{prog.programName}</h4>
                        <span className={`dash-badge ${prog.status === "active" ? "dash-badge-green" : prog.status === "paused" ? "dash-badge-amber" : "dash-badge-slate"}`}>{prog.status}</span>
                      </div>
                      {prog.description && <p className="text-sm mt-1" style={{ color: "#64748B" }}>{prog.description}</p>}
                    </div>
                    {prog.status === "active" && (
                      <button onClick={() => updateAffiliateProgram.mutateAsync({ programId: prog.id, status: "paused" }).then(() => utils.affiliate.myPrograms.invalidate())} className="dash-btn-secondary text-xs py-2 px-3">Pause</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="dash-badge dash-badge-blue">
                      {prog.commissionType === "percentage" ? `${prog.commissionRate ?? 0}%` : `Rs.${prog.commissionAmount ?? 0}`} commission
                    </span>
                    {prog.productName && <span className="dash-badge dash-badge-purple">{prog.productName}</span>}
                    <span className="dash-badge dash-badge-amber">{prog.cookieDuration} day cookie</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-2 rounded-xl" style={{ background: "#F8FAFF" }}><p className="font-bold text-sm" style={{ color: "#1E293B" }}>{prog.totalCreatorsJoined}</p><p className="text-xs" style={{ color: "#64748B" }}>Creators</p></div>
                    <div className="p-2 rounded-xl" style={{ background: "#F8FAFF" }}><p className="font-bold text-sm" style={{ color: "#1E293B" }}>{prog.totalClicks?.toLocaleString()}</p><p className="text-xs" style={{ color: "#64748B" }}>Clicks</p></div>
                    <div className="p-2 rounded-xl" style={{ background: "#F8FAFF" }}><p className="font-bold text-sm" style={{ color: "#1E293B" }}>{prog.totalConversions}</p><p className="text-xs" style={{ color: "#64748B" }}>Sales</p></div>
                    <div className="p-2 rounded-xl" style={{ background: "#F8FAFF" }}><p className="font-bold text-sm" style={{ color: "#1E293B" }}>Rs.{parseFloat(prog.totalCommissionPaid?.toString() ?? "0").toLocaleString()}</p><p className="text-xs" style={{ color: "#64748B" }}>Commission Paid</p></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No Affiliate Programs Yet" description="Create your first affiliate program to let creators earn commission on every sale they drive." />
          )}
        </div>
      )}

      {/* SETTINGS */}
      {activeTab === "settings" && (
        <div className="max-w-2xl dash-card p-8 animate-fade-up">
          <h3 className="font-semibold text-lg mb-6" style={{ color: "#1E293B" }}>Brand Profile</h3>
          {profile && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))" }}>
                  {profile.companyName?.[0] ?? user?.name?.[0] ?? "B"}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "#1E293B" }}>{profile.companyName}</p>
                  <p className="text-sm" style={{ color: "#64748B" }}>{profile.industry ?? "Brand"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ background: "#F8FAFF" }}>
                  <p className="text-xs mb-1" style={{ color: "#64748B" }}>Industry</p>
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{profile.industry ?? "—"}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "#F8FAFF" }}>
                  <p className="text-xs mb-1" style={{ color: "#64748B" }}>Location</p>
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{profile.city ?? profile.location ?? "—"}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "#F8FAFF" }}>
                  <p className="text-xs mb-1" style={{ color: "#64748B" }}>Phone</p>
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{profile.phone ?? "—"}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "#F8FAFF" }}>
                  <p className="text-xs mb-1" style={{ color: "#64748B" }}>Website</p>
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{profile.website ?? "—"}</p>
                </div>
              </div>
              {profile.description && (
                <div>
                  <p className="text-xs mb-1" style={{ color: "#64748B" }}>Description</p>
                  <p className="text-sm" style={{ color: "#1E293B" }}>{profile.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl" style={{ color: "#1E293B" }}>Create Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ color: "#64748B" }}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Title <span className="text-red-400">*</span></label><input type="text" value={campForm.title} onChange={(e) => setCampForm((p) => ({ ...p, title: e.target.value }))} placeholder="Summer Collection Launch" className="input-elegant" /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Description</label><textarea value={campForm.description} onChange={(e) => setCampForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="input-elegant resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Budget (Rs.)</label><input type="number" value={campForm.budget} onChange={(e) => setCampForm((p) => ({ ...p, budget: e.target.value }))} className="input-elegant" /></div>
                <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Creators Needed</label><input type="number" value={campForm.creatorCount} onChange={(e) => setCampForm((p) => ({ ...p, creatorCount: e.target.value }))} className="input-elegant" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Niche</label><input type="text" value={campForm.niche} onChange={(e) => setCampForm((p) => ({ ...p, niche: e.target.value }))} className="input-elegant" /></div>
                <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Location</label><input type="text" value={campForm.location} onChange={(e) => setCampForm((p) => ({ ...p, location: e.target.value }))} className="input-elegant" /></div>
              </div>
              <button onClick={handleCreateCampaign} disabled={!campForm.title || createCampaign.isPending} className="w-full dash-btn-primary disabled:opacity-50">{createCampaign.isPending ? "Creating..." : "Create Campaign"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Barter Deal Modal */}
      {showBarterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowBarterModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl" style={{ color: "#1E293B" }}>Post Barter Deal</h3>
              <button onClick={() => setShowBarterModal(false)} style={{ color: "#64748B" }}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Product Name <span className="text-red-400">*</span></label><input type="text" value={barterForm.productName} onChange={(e) => setBarterForm(p => ({ ...p, productName: e.target.value }))} placeholder="Skincare Serum Set" className="input-elegant" /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Product Description</label><textarea value={barterForm.productDescription} onChange={(e) => setBarterForm(p => ({ ...p, productDescription: e.target.value }))} rows={2} className="input-elegant resize-none" placeholder="Describe your product and what makes it special" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Product Value (Rs.)</label><input type="number" value={barterForm.productValue} onChange={(e) => setBarterForm(p => ({ ...p, productValue: e.target.value }))} className="input-elegant" /></div>
                <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Creator Slots</label><input type="number" value={barterForm.slotsTotal} onChange={(e) => setBarterForm(p => ({ ...p, slotsTotal: e.target.value }))} className="input-elegant" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Content Type Needed</label>
                <div className="flex flex-wrap gap-2">
                  {["Reel", "Post", "Story", "Video"].map((t) => (
                    <button key={t} onClick={() => toggleContentType(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${barterForm.contentType.includes(t) ? "bg-[#5B8DEF] text-white border-[#5B8DEF]" : "border-gray-200 text-gray-600 hover:border-blue-300"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Deliverables</label><input type="text" value={barterForm.deliverables} onChange={(e) => setBarterForm(p => ({ ...p, deliverables: e.target.value }))} placeholder="1 Instagram Reel + 2 Stories" className="input-elegant" /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Min. Followers Required</label><input type="number" value={barterForm.minFollowers} onChange={(e) => setBarterForm(p => ({ ...p, minFollowers: e.target.value }))} placeholder="5000" className="input-elegant" /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Instructions for Creators</label><textarea value={barterForm.instructions} onChange={(e) => setBarterForm(p => ({ ...p, instructions: e.target.value }))} rows={2} className="input-elegant resize-none" placeholder="Tag @brandname, use hashtag #BrandLaunch, mention key features" /></div>
              <button onClick={handleCreateBarter} disabled={!barterForm.productName || createBarterDeal.isPending} className="w-full dash-btn-primary disabled:opacity-50">{createBarterDeal.isPending ? "Posting..." : "Post Barter Deal"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Affiliate Program Modal */}
      {showAffiliateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAffiliateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl" style={{ color: "#1E293B" }}>Create Affiliate Program</h3>
              <button onClick={() => setShowAffiliateModal(false)} style={{ color: "#64748B" }}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Program Name <span className="text-red-400">*</span></label><input type="text" value={affiliateForm.programName} onChange={(e) => setAffiliateForm(p => ({ ...p, programName: e.target.value }))} placeholder="Summer Collection Affiliate" className="input-elegant" /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Description</label><textarea value={affiliateForm.description} onChange={(e) => setAffiliateForm(p => ({ ...p, description: e.target.value }))} rows={2} className="input-elegant resize-none" placeholder="What creators will promote" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Commission Type</label>
                  <select value={affiliateForm.commissionType} onChange={(e) => setAffiliateForm(p => ({ ...p, commissionType: e.target.value as "percentage" | "fixed" }))} className="input-elegant">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>{affiliateForm.commissionType === "percentage" ? "Rate (%)" : "Amount (Rs.)"}</label><input type="number" value={affiliateForm.commissionType === "percentage" ? affiliateForm.commissionRate : affiliateForm.commissionAmount} onChange={(e) => setAffiliateForm(p => ({ ...p, [affiliateForm.commissionType === "percentage" ? "commissionRate" : "commissionAmount"]: e.target.value }))} placeholder={affiliateForm.commissionType === "percentage" ? "10" : "500"} className="input-elegant" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Product Name</label><input type="text" value={affiliateForm.productName} onChange={(e) => setAffiliateForm(p => ({ ...p, productName: e.target.value }))} placeholder="Product to promote" className="input-elegant" /></div>
                <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Product Value (Rs.)</label><input type="number" value={affiliateForm.productValue} onChange={(e) => setAffiliateForm(p => ({ ...p, productValue: e.target.value }))} placeholder="999" className="input-elegant" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Product URL</label><input type="url" value={affiliateForm.productUrl} onChange={(e) => setAffiliateForm(p => ({ ...p, productUrl: e.target.value }))} placeholder="https://yourstore.com/product" className="input-elegant" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Cookie Duration (days)</label><input type="number" value={affiliateForm.cookieDuration} onChange={(e) => setAffiliateForm(p => ({ ...p, cookieDuration: e.target.value }))} className="input-elegant" /></div>
                <div><label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Min. Followers</label><input type="number" value={affiliateForm.minFollowers} onChange={(e) => setAffiliateForm(p => ({ ...p, minFollowers: e.target.value }))} placeholder="0" className="input-elegant" /></div>
              </div>
              <button onClick={async () => {
                await createAffiliateProgram.mutateAsync({
                  programName: affiliateForm.programName,
                  description: affiliateForm.description,
                  commissionType: affiliateForm.commissionType,
                  commissionRate: parseFloat(affiliateForm.commissionRate) || 10,
                  commissionAmount: affiliateForm.commissionType === "fixed" ? parseFloat(affiliateForm.commissionAmount) || 0 : undefined,
                  productName: affiliateForm.productName,
                  productValue: parseFloat(affiliateForm.productValue) || undefined,
                  productUrl: affiliateForm.productUrl,
                  cookieDuration: parseInt(affiliateForm.cookieDuration) || 30,
                  minFollowers: parseInt(affiliateForm.minFollowers) || 0,
                });
                setShowAffiliateModal(false);
                setAffiliateForm({ programName: "", description: "", commissionType: "percentage", commissionRate: "", commissionAmount: "", productName: "", productValue: "", productUrl: "", cookieDuration: "30", minFollowers: "0", creatorCategories: [] });
                utils.affiliate.myPrograms.invalidate();
              }} disabled={!affiliateForm.programName || createAffiliateProgram.isPending} className="w-full dash-btn-primary disabled:opacity-50">{createAffiliateProgram.isPending ? "Creating..." : "Create Program"}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
