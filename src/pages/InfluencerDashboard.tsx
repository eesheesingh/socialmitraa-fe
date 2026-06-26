import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import {
  LayoutDashboard, Megaphone, Wallet, Settings, Brain,
  CheckCircle2, Clock, DollarSign, Send, Gift, Package, Hash,
  ExternalLink, Percent, ShoppingBag, Copy, Check,
  Shield, Bot, Globe,
} from "lucide-react";
import ConsentModal from "@/components/ConsentModal";
import DashboardLayout from "@/components/DashboardLayout";
import { LoadingState, EmptyState } from "@/components/DashboardStates";

type Tab = "overview" | "campaigns" | "matches" | "earnings" | "barter" | "affiliate" | "settings";

const navItems = [
  { id: "overview" as Tab, label: "Overview", icon: LayoutDashboard },
  { id: "campaigns" as Tab, label: "Campaigns", icon: Megaphone },
  { id: "matches" as Tab, label: "AI Matches", icon: Brain },
  { id: "earnings" as Tab, label: "Earnings", icon: Wallet },
  { id: "barter" as Tab, label: "Barter Deals", icon: Gift },
  { id: "affiliate" as Tab, label: "Affiliate", icon: Percent },
  { id: "settings" as Tab, label: "Settings", icon: Settings },
];

export default function InfluencerDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, isInfluencer } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [selectedBarterDeal, setSelectedBarterDeal] = useState<number | null>(null);
  const [appMessage, setAppMessage] = useState("");
  const [appRate, setAppRate] = useState("");
  const [barterMessage, setBarterMessage] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  const { data: profile } = trpc.influencer.getProfile.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: allCampaigns } = trpc.campaign.list.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: myApplications } = trpc.campaign.myApplications.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: aiMatches } = trpc.match.myMatches.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: myEarnings } = trpc.payment.myEarnings.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: barterDeals } = trpc.barter.browseDeals.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: myBarterApps } = trpc.barter.myApplications.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: consentStatus } = trpc.consent.checkStatus.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: browseAffiliatePrograms } = trpc.affiliate.browsePrograms.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const { data: myAffiliateLinks } = trpc.affiliate.myLinks.useQuery(undefined, { enabled: isAuthenticated && !isLoading });
  const joinAffiliateProgram = trpc.affiliate.joinProgram.useMutation();
  const [joinedProgramId, setJoinedProgramId] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState("");
  const applyMut = trpc.campaign.submitApplication.useMutation();
  const applyBarterMut = trpc.barter.submitApplication.useMutation();
  const submitContentMut = trpc.barter.submitContent.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (consentStatus && !consentStatus.hasAccepted && !consentChecked) {
      setShowConsent(true);
      setConsentChecked(true);
    }
  }, [consentStatus, consentChecked]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login");
    if (!isLoading && isAuthenticated && !isInfluencer) navigate("/onboarding");
  }, [isLoading, isAuthenticated, isInfluencer, navigate]);

  const handleApply = async () => {
    if (!selectedCampaign) return;
    try {
      await applyMut.mutateAsync({ campaignId: selectedCampaign, message: appMessage, proposedRate: parseFloat(appRate) || undefined });
      setSelectedCampaign(null); setAppMessage(""); setAppRate("");
      utils.campaign.myApplications.invalidate();
    } catch (e) { console.error(e); }
  };

  const handleBarterApply = async () => {
    if (!selectedBarterDeal) return;
    try {
      await applyBarterMut.mutateAsync({ dealId: selectedBarterDeal, message: barterMessage });
      setSelectedBarterDeal(null); setBarterMessage("");
      utils.barter.myApplications.invalidate();
    } catch (e) { console.error(e); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}><div className="w-8 h-8 border-2 border-[#5B8DEF] border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated || !isInfluencer) return null;

  const accepted = myApplications?.filter((a) => a.status === "accepted") ?? [];
  const totalEarned = accepted.reduce((s, a) => s + parseFloat(a.proposedRate?.toString() ?? "0"), 0);
  const pending = myApplications?.filter((a) => a.status === "pending") ?? [];

  const quickLinks = [
    { label: "Mitraa Score", icon: Shield, path: "/mitraa-score" },
    { label: "AI Negotiation", icon: Bot, path: "/negotiation" },
    { label: "Language Hub", icon: Globe, path: "/regional-hub" },
  ];

  const statCards = [
    { label: "Available Campaigns", value: (allCampaigns?.length ?? 0).toString(), icon: Megaphone, color: "blue" as const, change: "Browse now" },
    { label: "My Applications", value: (myApplications?.length ?? 0).toString(), icon: Send, color: "green" as const, change: `${pending.length} pending` },
    { label: "AI Matches", value: (aiMatches?.length ?? 0).toString(), icon: Brain, color: "purple" as const, change: "View matches" },
    { label: "Total Earnings", value: `Rs.${totalEarned.toLocaleString()}`, icon: DollarSign, color: "amber" as const, change: "This month" },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as Tab)}
      title="Creator Dashboard"
      subtitle="Manage campaigns, barter deals, and earnings"
      roleLabel="Creator"
      actions={
        <button onClick={() => setActiveTab("campaigns")} className="dash-btn-primary">
          <Megaphone className="w-4 h-4" /> Find Work
        </button>
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
            {statCards.map((s) => (
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
                <h3 className="font-semibold" style={{ color: "#1E293B" }}>Quick Actions</h3>
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
                      {profile.displayName?.[0] ?? user?.name?.[0] ?? "C"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#1E293B" }}>{profile.displayName}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>{profile.niche ?? "Creator"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={{ background: "#F8FAFF" }}>
                      <p className="text-lg font-bold" style={{ color: "var(--blue)" }}>{(profile.followerCount ?? 0).toLocaleString()}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>Followers</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "#F8FAFF" }}>
                      <p className="text-lg font-bold" style={{ color: "var(--blue)" }}>{profile.engagementRate ?? "—"}%</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>Engagement</p>
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
          {allCampaigns === undefined ? (
            <LoadingState />
          ) : allCampaigns.length > 0 ? allCampaigns.map((camp) => {
            const hasApplied = myApplications?.some((a) => a.campaignId === camp.id);
            return (
              <div key={camp.id} className="dash-card p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg" style={{ color: "#1E293B" }}>{camp.title}</h3>
                      {camp.niche && <span className="dash-badge dash-badge-slate">{camp.niche}</span>}
                    </div>
                    <p className="text-sm mb-3" style={{ color: "#64748B" }}>{camp.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: "#64748B" }}>
                      {camp.location && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />{camp.location}</span>}
                      <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{camp.creatorCount} needed</span>
                    </div>
                  </div>
                  <div className="text-left md:text-right min-w-[140px]">
                    <p className="font-bold text-xl" style={{ color: "var(--blue)" }}>Rs.{parseFloat(camp.budget?.toString() ?? "0").toLocaleString()}</p>
                    <p className="text-xs" style={{ color: "#64748B" }}>budget</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
                  {hasApplied ? (
                    <span className="dash-badge dash-badge-green"><CheckCircle2 className="w-3 h-3 mr-1" />Applied</span>
                  ) : (
                    <span className="dash-badge dash-badge-blue"><Clock className="w-3 h-3 mr-1" />Open</span>
                  )}
                  <button
                    onClick={() => setSelectedCampaign(camp.id)}
                    disabled={hasApplied}
                    className={hasApplied ? "dash-btn-secondary opacity-50 cursor-not-allowed" : "dash-btn-primary"}
                  >
                    {hasApplied ? "Applied" : "Apply Now"}
                  </button>
                </div>
              </div>
            );
          }) : (
            <EmptyState title="No campaigns yet" description="Check back soon for new brand campaigns." />
          )}
        </div>
      )}

      {/* AI MATCHES */}
      {activeTab === "matches" && (
        <div className="space-y-4 animate-fade-up">
          {aiMatches === undefined ? (
            <LoadingState />
          ) : aiMatches.length > 0 ? aiMatches.map((m: any) => (
            <div key={m.id} className="dash-card p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg" style={{ color: "#1E293B" }}>{m.requirement?.campaignTitle ?? `Campaign #${m.requirementId}`}</h3>
                  <p className="text-sm mt-1" style={{ color: "#64748B" }}>{m.matchReason}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="dash-badge dash-badge-blue">{m.categoryMatch ?? 0}% category</span>
                    <span className="dash-badge dash-badge-purple">{m.followerMatch ?? 0}% followers</span>
                    <span className="dash-badge dash-badge-amber">{m.engagementMatch ?? 0}% engagement</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${m.matchScore >= 80 ? "dash-icon-circle-green" : m.matchScore >= 60 ? "dash-icon-circle-amber" : "dash-icon-circle-slate"}`}>
                    <span className="font-bold text-lg">{m.matchScore}%</span>
                    <span className="text-[9px] font-semibold uppercase">Match</span>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <EmptyState title="No AI Matches Yet" description="Complete your profile to get AI-matched with brands." />
          )}
        </div>
      )}

      {/* EARNINGS */}
      {activeTab === "earnings" && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total Earnings", value: `Rs.${(myEarnings?.reduce((s, p) => s + parseFloat(p.amount?.toString() ?? "0"), 0) ?? 0).toLocaleString()}`, icon: DollarSign, color: "amber" as const },
              { label: "Active Deals", value: accepted.length.toString(), icon: CheckCircle2, color: "green" as const },
              { label: "Pending", value: pending.length.toString(), icon: Clock, color: "blue" as const },
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

          <div className="dash-card p-6">
            <h3 className="font-semibold mb-4" style={{ color: "#1E293B" }}>Payment History</h3>
            {myEarnings === undefined ? (
              <LoadingState />
            ) : myEarnings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full dash-table">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myEarnings.map((p: any) => (
                      <tr key={p.id}>
                        <td>{p.campaign?.title ?? "—"}</td>
                        <td className="font-semibold" style={{ color: "#1E293B" }}>Rs.{parseFloat(p.amount?.toString() ?? "0").toLocaleString()}</td>
                        <td><span className={`dash-badge dash-badge-${p.status === "released" ? "green" : p.status === "refunded" ? "red" : "amber"}`}>{p.status}</span></td>
                        <td style={{ color: "#64748B" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No payments yet" description="Earnings will appear here once campaigns are completed." />
            )}
          </div>
        </div>
      )}

      {/* BARTER DEALS */}
      {activeTab === "barter" && (
        <div className="space-y-6 animate-fade-up">
          {myBarterApps && myBarterApps.length > 0 && (
            <div className="dash-card p-6">
              <h3 className="font-semibold mb-4" style={{ color: "#1E293B" }}>My Barter Applications</h3>
              <div className="space-y-4">
                {myBarterApps.map((app: any) => (
                  <div key={app.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl" style={{ background: "#F8FAFF" }}>
                    <div className="flex items-center gap-4">
                      <div className="dash-icon-circle dash-icon-circle-blue">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "#1E293B" }}>{app.deal?.productName}</p>
                        <p className="text-xs" style={{ color: "#64748B" }}>{app.brand?.brandName ?? "Brand"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`dash-badge ${app.status === "approved" ? "dash-badge-green" : app.status === "applied" ? "dash-badge-blue" : app.status === "rejected" ? "dash-badge-red" : "dash-badge-amber"}`}>{app.status}</span>
                      {app.status === "approved" && (
                        <button onClick={() => {
                          const links = [prompt("Enter content link (Instagram Reel/Post URL):")];
                          if (links[0]) {
                            submitContentMut.mutateAsync({ applicationId: app.id, contentLinks: links as string[] })
                              .then(() => utils.barter.myApplications.invalidate());
                          }
                        }} className="dash-btn-secondary text-xs py-2 px-3">
                          <ExternalLink className="w-3 h-3" /> Submit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-lg mb-4" style={{ color: "#1E293B" }}>Browse Open Barter Deals</h3>
            {barterDeals === undefined ? (
              <LoadingState />
            ) : barterDeals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {barterDeals.map((deal: any) => {
                  const alreadyApplied = myBarterApps?.some((a: any) => a.dealId === deal.id);
                  return (
                    <div key={deal.id} className="dash-card p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="dash-icon-circle dash-icon-circle-blue">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm" style={{ color: "#1E293B" }}>{deal.productName}</h4>
                          <p className="text-xs" style={{ color: "#64748B" }}>{deal.brand?.brandName ?? deal.brand?.companyName ?? "Brand"}</p>
                        </div>
                      </div>
                      {deal.productDescription && (
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: "#64748B" }}>{deal.productDescription}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {Array.isArray(deal.contentType) && deal.contentType.map((t: string) => (
                          <span key={t} className="dash-badge dash-badge-blue">{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs mb-4" style={{ color: "#64748B" }}>
                        <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{deal.slotsFilled}/{deal.slotsTotal} slots</span>
                        {deal.productValue && <span>Value: Rs.{parseFloat(deal.productValue.toString()).toLocaleString()}</span>}
                      </div>
                      {alreadyApplied ? (
                        <span className="dash-badge dash-badge-green"><CheckCircle2 className="w-3 h-3 mr-1" />Applied</span>
                      ) : (
                        <button onClick={() => setSelectedBarterDeal(deal.id)} className="w-full dash-btn-primary">
                          Apply for Barter
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No open barter deals" description="Check back later for new product-for-content opportunities." />
            )}
          </div>
        </div>
      )}

      {/* AFFILIATE */}
      {activeTab === "affiliate" && (
        <div className="space-y-6 animate-fade-up">
          {myAffiliateLinks && myAffiliateLinks.length > 0 && (
            <div className="dash-card p-6">
              <h3 className="font-semibold mb-4" style={{ color: "#1E293B" }}>My Affiliate Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myAffiliateLinks.map((link: any) => (
                  <div key={link.id} className="p-4 rounded-xl" style={{ background: "#F8FAFF" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="dash-icon-circle dash-icon-circle-purple">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "#1E293B" }}>{link.program?.programName}</p>
                          <p className="text-xs" style={{ color: "#64748B" }}>{link.brand?.brandName ?? link.brand?.companyName}</p>
                        </div>
                      </div>
                      <span className="dash-badge dash-badge-purple">
                        {link.program?.commissionType === "percentage" ? `${link.program?.commissionRate ?? 0}%` : `Rs.${link.program?.commissionAmount ?? 0}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl mb-3 bg-white border" style={{ borderColor: "#E8E4DE" }}>
                      <span className="text-sm font-mono font-bold" style={{ color: "#1E293B" }}>{link.uniqueCode}</span>
                      <button onClick={() => { navigator.clipboard.writeText(link.uniqueCode); setCopiedCode(link.uniqueCode); setTimeout(() => setCopiedCode(""), 2000); }} className="ml-auto text-xs flex items-center gap-1" style={{ color: "var(--blue)" }}>
                        {copiedCode === link.uniqueCode ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div><p className="font-bold">{link.clicks}</p><p style={{ color: "#64748B" }}>Clicks</p></div>
                      <div><p className="font-bold">{link.conversions}</p><p style={{ color: "#64748B" }}>Sales</p></div>
                      <div><p className="font-bold">Rs.{parseFloat(link.commissionEarned?.toString() ?? "0").toLocaleString()}</p><p style={{ color: "#64748B" }}>Earned</p></div>
                      <div><p className="font-bold">Rs.{link.pendingCommission?.toLocaleString()}</p><p style={{ color: "#64748B" }}>Pending</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-lg mb-4" style={{ color: "#1E293B" }}>Browse Affiliate Programs</h3>
            {browseAffiliatePrograms === undefined ? (
              <LoadingState />
            ) : browseAffiliatePrograms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {browseAffiliatePrograms.map((prog: any) => {
                  const alreadyJoined = myAffiliateLinks?.some((l: any) => l.programId === prog.id);
                  return (
                    <div key={prog.id} className="dash-card p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="dash-icon-circle dash-icon-circle-purple">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "#1E293B" }}>{prog.programName}</p>
                          <p className="text-xs" style={{ color: "#64748B" }}>{prog.brand?.brandName ?? prog.brand?.companyName}</p>
                        </div>
                      </div>
                      {prog.description && <p className="text-sm mb-3" style={{ color: "#64748B" }}>{prog.description}</p>}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="dash-badge dash-badge-purple">
                          {prog.commissionType === "percentage" ? `${prog.commissionRate ?? 0}%` : `Rs.${prog.commissionAmount ?? 0}`} commission
                        </span>
                        {prog.productName && <span className="dash-badge dash-badge-slate">{prog.productName}</span>}
                        <span className="dash-badge dash-badge-amber">{prog.cookieDuration}d cookie</span>
                      </div>
                      {alreadyJoined ? (
                        <span className="dash-badge dash-badge-green"><CheckCircle2 className="w-3 h-3 mr-1" />Joined</span>
                      ) : (
                        <button onClick={() => {
                          joinAffiliateProgram.mutateAsync({ programId: prog.id })
                            .then(() => { setJoinedProgramId(prog.id); utils.affiliate.myLinks.invalidate(); });
                        }} disabled={joinAffiliateProgram.isPending} className="w-full dash-btn-primary disabled:opacity-50">
                          {joinAffiliateProgram.isPending && joinedProgramId === prog.id ? "Joining..." : "Join Program"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No active affiliate programs" description="Check back later for commission opportunities." />
            )}
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {activeTab === "settings" && (
        <div className="max-w-2xl dash-card p-8 animate-fade-up">
          <h3 className="font-semibold text-lg mb-6" style={{ color: "#1E293B" }}>Creator Profile</h3>
          {profile ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))" }}>
                  {profile.displayName?.[0] ?? user?.name?.[0] ?? "C"}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "#1E293B" }}>{profile.displayName}</p>
                  <p className="text-sm" style={{ color: "#64748B" }}>{profile.fullName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ background: "#F8FAFF" }}>
                  <p className="text-xs mb-1" style={{ color: "#64748B" }}>Niche</p>
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{profile.niche ?? "—"}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "#F8FAFF" }}>
                  <p className="text-xs mb-1" style={{ color: "#64748B" }}>Followers</p>
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{(profile.followerCount ?? 0).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "#F8FAFF" }}>
                  <p className="text-xs mb-1" style={{ color: "#64748B" }}>Engagement</p>
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{profile.engagementRate ?? "—"}%</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "#F8FAFF" }}>
                  <p className="text-xs mb-1" style={{ color: "#64748B" }}>Location</p>
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{profile.location ?? "—"}</p>
                </div>
              </div>
              {profile.categories && (
                <div>
                  <p className="text-xs mb-2" style={{ color: "#64748B" }}>Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile.categories as string[]).map((c) => <span key={c} className="dash-badge dash-badge-blue">{c}</span>)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <LoadingState />
          )}
        </div>
      )}

      {/* Modals */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedCampaign(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6" style={{ border: "1px solid #E8E4DE" }}>
            <h3 className="font-semibold text-xl mb-4" style={{ color: "#1E293B" }}>Apply to Campaign</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Message</label>
                <textarea value={appMessage} onChange={(e) => setAppMessage(e.target.value)} placeholder="Why you're a good fit..." rows={3} className="input-elegant resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Your Rate (Rs.)</label>
                <input type="number" value={appRate} onChange={(e) => setAppRate(e.target.value)} placeholder="Proposed rate" className="input-elegant" />
              </div>
              <button onClick={handleApply} disabled={applyMut.isPending} className="w-full dash-btn-primary">{applyMut.isPending ? "Applying..." : "Submit Application"}</button>
            </div>
          </div>
        </div>
      )}

      {selectedBarterDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedBarterDeal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6" style={{ border: "1px solid #E8E4DE" }}>
            <h3 className="font-semibold text-xl mb-4" style={{ color: "#1E293B" }}>Apply for Barter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#64748B" }}>Why do you want this product?</label>
                <textarea value={barterMessage} onChange={(e) => setBarterMessage(e.target.value)} placeholder="Tell the brand why you're a great fit..." rows={3} className="input-elegant resize-none" />
              </div>
              <button onClick={handleBarterApply} disabled={applyBarterMut.isPending} className="w-full dash-btn-primary">{applyBarterMut.isPending ? "Applying..." : "Apply for Barter"}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
