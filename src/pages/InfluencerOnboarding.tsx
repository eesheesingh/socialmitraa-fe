import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import { trpc } from "@/providers/trpc";
import {
  ArrowRight, ArrowLeft, Check, Loader2,
  Instagram, Facebook, Youtube, AtSign, Phone, Mail, MapPin,
  Shield, ShieldAlert, ShieldCheck, TrendingUp, Users, Eye, Hash,
  BarChart3, Camera, Film, ImageIcon,
} from "lucide-react";

const CATEGORIES = [
  "Fashion", "Beauty", "Fitness", "Food", "Travel", "Lifestyle",
  "Technology", "Finance", "Education", "Gaming", "Parenting",
  "Photography", "Art", "Music", "Dance", "Comedy", "Motivation",
  "Business", "Health & Wellness", "Sports", "Automotive",
  "Real Estate", "Pets", "DIY & Crafts", "Book & Literature",
  "News & Politics", "Science", "Environment", "Spirituality",
  "Relationships", "Luxury", "Review & Unboxing", "Event Coverage",
  "Cooking & Recipes", "Home Decor", "Gardening", "Astrology",
  "Legal Advice", "Medical & Health", "Entertainment",
  "Vlogging", "Podcasting",
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "tiktok", label: "TikTok", icon: AtSign },
  { id: "twitter", label: "Twitter/X", icon: AtSign },
  { id: "linkedin", label: "LinkedIn", icon: AtSign },
];

function FakeFollowerBadge({ percentage, rating }: { percentage: number; rating: string }) {
  const getColor = () => {
    if (rating === "Excellent") return { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" };
    if (rating === "Good") return { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" };
    if (rating === "Average") return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" };
    if (rating === "Poor") return { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" };
    return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" };
  };
  const c = getColor();
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {rating === "Excellent" || rating === "Good" ? <ShieldCheck className="w-4 h-4" /> : rating === "Average" ? <Shield className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
      {rating} — {percentage}% estimated fake
    </div>
  );
}

function AnalyticsCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${color}10` }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{value}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
      </div>
    </div>
  );
}

export default function InfluencerOnboarding() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isInfluencer } = useAuth();
  const updateProfile = trpc.influencer.updateProfile.useMutation();
  const completeOnboarding = useMutation({
    mutationFn: () => authApi.completeOnboarding(),
  });
  const { refetch: analyzeProfile } = trpc.instagram.analyzeMyProfile.useQuery(undefined, { enabled: false });
  const [step, setStep] = useState(0);
  const [fetchingAnalytics, setFetchingAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "", displayName: "", bio: "",
    email: "", phone: "",
    instagramId: "", facebookId: "", youtubeId: "", tiktokId: "", twitterId: "", linkedinId: "",
    categories: [] as string[], niche: "",
    location: "", city: "",
    followerCount: 0, engagementRate: 0, avgLikes: 0, avgComments: 0, avgReach: 0,
    platforms: [] as string[],
    ratePerPost: 0, ratePerStory: 0, ratePerReel: 0, ratePerVideo: 0,
    sampleWork: "",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login");
    if (!isLoading && isAuthenticated && !isInfluencer) navigate("/onboarding");
  }, [isLoading, isAuthenticated, isInfluencer, navigate]);

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter((c) => c !== cat) : [...prev.categories, cat],
    }));
  };

  const togglePlatform = (pid: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(pid) ? prev.platforms.filter((p) => p !== pid) : [...prev.platforms, pid],
    }));
  };

  // Auto-fetch analytics when Instagram ID is entered
  const handleInstagramBlur = async () => {
    const igId = formData.instagramId.replace(/^@/, "").trim();
    if (!igId || igId.length < 3) return;
    setFetchingAnalytics(true);
    try {
      // First fetch public analytics for preview
      const { data: result } = await analyzeProfile();
      if (result && "analytics" in result && result.analytics) {
        setAnalyticsData(result.analytics);
        // Pre-fill form with analytics data
        setFormData((prev) => ({
          ...prev,
          followerCount: result.analytics.followers || prev.followerCount,
          engagementRate: result.analytics.engagementRate || prev.engagementRate,
          avgLikes: result.analytics.avgLikes || prev.avgLikes,
          avgComments: result.analytics.avgComments || prev.avgComments,
          avgReach: result.analytics.estimatedReach || prev.avgReach,
        }));
      }
    } catch (e) {
      console.error("Analytics fetch failed:", e);
    } finally {
      setFetchingAnalytics(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await updateProfile.mutateAsync(formData);
      await completeOnboarding.mutateAsync();
      navigate("/influencer/dashboard");
    } catch (error) {
      console.error("Failed:", error);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}><div className="w-8 h-8 border-2 border-[#5B8DEF] border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated || !isInfluencer) return null;

  const steps = [
    {
      title: "Personal Details",
      description: "Tell us who you are.",
      canProceed: formData.fullName.length > 0 && formData.displayName.length > 0,
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Full Name <span className="text-red-400">*</span></label>
            <input type="text" value={formData.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Your full name" className="input-elegant" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Display Name / Handle <span className="text-red-400">*</span></label>
            <input type="text" value={formData.displayName} onChange={(e) => updateField("displayName", e.target.value)} placeholder="@yourhandle" className="input-elegant" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Bio</label>
            <textarea value={formData.bio} onChange={(e) => updateField("bio", e.target.value)} placeholder="Tell brands about yourself..." rows={3} className="input-elegant resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-2 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}><Mail className="w-3 h-3" /> Email</label><input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" className="input-elegant" /></div>
            <div><label className="block text-sm font-medium mb-2 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}><Phone className="w-3 h-3" /> Phone</label><input type="tel" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+91 98765 43210" className="input-elegant" /></div>
          </div>
        </div>
      ),
    },
    {
      title: "Social Media IDs",
      description: "Share your social media handles. We'll auto-analyze your Instagram.",
      canProceed: true,
      content: (
        <div className="space-y-5">
          <div className="relative">
            <label className="block text-sm font-medium mb-2 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}><Instagram className="w-4 h-4 text-pink-500" /> Instagram ID <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text" value={formData.instagramId}
                onChange={(e) => { updateField("instagramId", e.target.value); setAnalyticsData(null); }}
                onBlur={handleInstagramBlur}
                placeholder="@your.insta"
                className="input-elegant pr-10"
              />
              {fetchingAnalytics && <Loader2 className="absolute right-3 top-3 w-5 h-5 animate-spin" style={{ color: "var(--blue)" }} />}
              {analyticsData && !fetchingAnalytics && <ShieldCheck className="absolute right-3 top-3 w-5 h-5" style={{ color: "#10B981" }} />}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>We&apos;ll auto-fetch your engagement, follower quality &amp; analytics</p>
          </div>

          {/* Analytics Results */}
          {analyticsData && (
            <div className="p-5 rounded-2xl border animate-scale-in" style={{ background: "var(--bg-muted)", borderColor: "var(--border-light)" }}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5" style={{ color: "var(--blue)" }} />
                <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Instagram Analytics (AI-Generated)</h3>
              </div>

              {/* Overall Score */}
              <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-white">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border-light)" strokeWidth="6" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke={analyticsData.overallScore >= 70 ? "#10B981" : analyticsData.overallScore >= 50 ? "#5B8DEF" : "#F59E0B"} strokeWidth="6" strokeDasharray={`${analyticsData.overallScore * 1.76} 176`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-sm">{analyticsData.overallScore}</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{analyticsData.overallRating} Score</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Based on engagement, quality &amp; activity</p>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <AnalyticsCard icon={<Users className="w-4 h-4" />} label="Followers" value={analyticsData.followers?.toLocaleString() ?? "—"} color="#5B8DEF" />
                <AnalyticsCard icon={<TrendingUp className="w-4 h-4" />} label="Engagement Rate" value={`${analyticsData.engagementRate}%`} color="#10B981" />
                <AnalyticsCard icon={<Eye className="w-4 h-4" />} label="Est. Reach" value={analyticsData.estimatedReach?.toLocaleString() ?? "—"} color="#7C3AED" />
                <AnalyticsCard icon={<Hash className="w-4 h-4" />} label="Posts/Week" value={`${analyticsData.postFrequency}`} color="#F59E0B" />
              </div>

              {/* Avg Likes/Comments */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-white text-center">
                  <p className="font-bold text-sm">{analyticsData.avgLikes?.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Avg Likes</p>
                </div>
                <div className="p-2 rounded-lg bg-white text-center">
                  <p className="font-bold text-sm">{analyticsData.avgComments?.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Avg Comments</p>
                </div>
              </div>

              {/* Fake Follower Detection */}
              <div className="mb-3">
                <FakeFollowerBadge percentage={analyticsData.fakeFollowerPercentage} rating={analyticsData.followerQualityRating} />
              </div>

              {/* Content Breakdown */}
              {analyticsData.contentTypes && (
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "#FDF2F8", color: "#EC4899" }}><Film className="w-3 h-3" /> {analyticsData.contentTypes.reel} Reels</span>
                  <span className="px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "#EFF6FF", color: "#5B8DEF" }}><Camera className="w-3 h-3" /> {analyticsData.contentTypes.post} Posts</span>
                  <span className="px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "#F0FDF4", color: "#10B981" }}><ImageIcon className="w-3 h-3" /> {analyticsData.contentTypes.carousel} Carousels</span>
                </div>
              )}

              {/* Top Hashtags */}
              {analyticsData.topHashtags && analyticsData.topHashtags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {analyticsData.topHashtags.slice(0, 6).map((tag: string) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--blue-light)", color: "var(--blue)" }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div><label className="block text-sm font-medium mb-2 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}><Facebook className="w-4 h-4" style={{ color: "#5B8DEF" }} /> Facebook ID</label><input type="text" value={formData.facebookId} onChange={(e) => updateField("facebookId", e.target.value)} placeholder="facebook.com/yourpage" className="input-elegant" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}><Youtube className="w-3 h-3 inline text-red-500 mr-1" />YouTube</label><input type="text" value={formData.youtubeId} onChange={(e) => updateField("youtubeId", e.target.value)} placeholder="Channel name" className="input-elegant" /></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>TikTok</label><input type="text" value={formData.tiktokId} onChange={(e) => updateField("tiktokId", e.target.value)} placeholder="@username" className="input-elegant" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Twitter/X</label><input type="text" value={formData.twitterId} onChange={(e) => updateField("twitterId", e.target.value)} placeholder="@handle" className="input-elegant" /></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>LinkedIn</label><input type="text" value={formData.linkedinId} onChange={(e) => updateField("linkedinId", e.target.value)} placeholder="Profile URL" className="input-elegant" /></div>
          </div>
        </div>
      ),
    },
    {
      title: "Creator Categories",
      description: "Select all categories that apply to you.",
      canProceed: formData.categories.length > 0,
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
              What type of creator are you? <span className="font-normal" style={{ color: "var(--text-muted)" }}>({formData.categories.length} selected)</span> <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto p-1">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => toggleCategory(cat)} className={`pill ${formData.categories.includes(cat) ? "pill-selected" : ""}`}>
                  {formData.categories.includes(cat) && <Check className="w-3 h-3 inline mr-1" />}{cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Primary Niche</label>
            <input type="text" value={formData.niche} onChange={(e) => updateField("niche", e.target.value)} placeholder="Your main content niche" className="input-elegant" />
          </div>
        </div>
      ),
    },
    {
      title: "Location & Platforms",
      description: "Where are you based and where do you create?",
      canProceed: true,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-2 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}><MapPin className="w-3 h-3" /> City</label><input type="text" value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="e.g., Mumbai" className="input-elegant" /></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>State/Region</label><input type="text" value={formData.location} onChange={(e) => updateField("location", e.target.value)} placeholder="e.g., Maharashtra" className="input-elegant" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>Active Platforms (select all)</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button key={p.id} onClick={() => togglePlatform(p.id)} className={`pill ${formData.platforms.includes(p.id) ? "pill-selected" : ""}`}>
                  <p.icon className="w-3.5 h-3.5 inline mr-1" />{p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Follower Count</label><input type="number" value={formData.followerCount || ""} onChange={(e) => updateField("followerCount", parseInt(e.target.value) || 0)} placeholder="e.g., 50000" className="input-elegant" /></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Engagement Rate (%)</label><input type="number" step="0.1" value={formData.engagementRate || ""} onChange={(e) => updateField("engagementRate", parseFloat(e.target.value) || 0)} placeholder="e.g., 4.5" className="input-elegant" /></div>
          </div>
        </div>
      ),
    },
    {
      title: "Rate Card",
      description: "Set your rates for brand collaborations (in INR).",
      canProceed: true,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Per Post (Rs.)", field: "ratePerPost" },
              { label: "Per Story (Rs.)", field: "ratePerStory" },
              { label: "Per Reel (Rs.)", field: "ratePerReel" },
              { label: "Per Video (Rs.)", field: "ratePerVideo" },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>{label}</label>
                <input type="number" value={(formData as Record<string, unknown>)[field] as number || ""} onChange={(e) => updateField(field, parseInt(e.target.value) || 0)} placeholder="e.g., 15000" className="input-elegant" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Sample Work / Portfolio Link</label>
            <input type="url" value={formData.sampleWork} onChange={(e) => updateField("sampleWork", e.target.value)} placeholder="Link to your best work" className="input-elegant" />
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, var(--bg-primary) 100%)" }}>
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Social Mitraa" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>Creator Signup</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Step {step + 1} of {steps.length}</p>
        </div>

        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-[#5B8DEF]" : "bg-[#E2E8F0]"}`} />
          ))}
        </div>

        <div className="card-surface p-8">
          <h2 className="font-semibold text-lg mb-1" style={{ color: "var(--text-primary)" }}>{currentStep.title}</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{currentStep.description}</p>
          {currentStep.content}
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={() => { if (step === 0) navigate("/onboarding"); else setStep(step - 1); }} className="flex items-center gap-2 text-sm nav-blue">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => { if (step < steps.length - 1) setStep(step + 1); else handleSubmit(); }}
            disabled={!currentStep.canProceed || updateProfile.isPending}
            className="btn-primary-blue flex items-center gap-2 disabled:opacity-50"
          >
            {step === steps.length - 1 ? (
              <>{updateProfile.isPending ? "Saving..." : "Complete"} <Check className="w-4 h-4" /></>
            ) : (
              <>Next <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
