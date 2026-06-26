import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Instagram, Users, Heart, MessageCircle, Eye, TrendingUp,
  ShieldCheck, ShieldAlert, Shield, Star, Hash, Camera, Film, ImageIcon,
  ArrowLeft, CheckCircle2, MapPin, Bookmark, Share2,
} from "lucide-react";

export default function CreatorMediaKit() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const { data: kit, isLoading } = trpc.mediaKit.getByUsername.useQuery(
    { username: username ?? "" },
    { enabled: !!username }
  );

  const incrementView = trpc.mediaKit.incrementView.useMutation();

  // Track view on mount
  useEffect(() => {
    if (username) incrementView.mutate({ username });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="w-10 h-10 border-3 border-[#5B8DEF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="text-center">
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Creator not found</p>
          <button onClick={() => navigate("/")} className="nav-blue">Back to home</button>
        </div>
      </div>
    );
  }

  const s = kit.stats;
  const overallColor = s.overallScore >= 70 ? "#10B981" : s.overallScore >= 50 ? "#5B8DEF" : "#F59E0B";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="bg-white border-b" style={{ borderColor: "var(--border-light)" }}>
        <div className="section-container py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 nav-blue">
              <ArrowLeft className="w-4 h-4" /> Back to Social Mitraa
            </button>
            <img src="/logo.png" alt="Social Mitraa" className="h-8 w-auto" />
          </div>
        </div>
      </div>

      <div className="section-container py-12">
        {/* Hero Card */}
        <div className="surface-card p-8 lg:p-12 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5" style={{ background: "var(--blue)", filter: "blur(80px)", transform: "translate(30%, -30%)" }} />

          <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-3xl font-bold text-white" style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))" }}>
                {kit.displayName?.charAt(0)?.toUpperCase() ?? "C"}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-bold text-3xl" style={{ color: "var(--text-primary)" }}>{kit.displayName}</h1>
                {kit.isVerified && <ShieldCheck className="w-6 h-6" style={{ color: "#5B8DEF" }} />}
              </div>
              <p className="text-lg mb-2" style={{ color: "var(--blue)" }}>{kit.headline}</p>
              <div className="flex items-center gap-4 mb-4">
                {kit.location && <span className="text-sm flex items-center gap-1" style={{ color: "var(--text-muted)" }}><MapPin className="w-4 h-4" />{kit.location}</span>}
                <span className="text-sm flex items-center gap-1" style={{ color: "var(--text-muted)" }}><Instagram className="w-4 h-4" />@{kit.instagramId}</span>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>{(kit.viewCount ?? 0).toLocaleString()} views</span>
              </div>
              <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>{kit.about}</p>
            </div>

            {/* Overall Score */}
            <div className="flex-shrink-0 text-center">
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="var(--border-light)" strokeWidth="8" />
                  <circle cx="48" cy="48" r="40" fill="none" stroke={overallColor} strokeWidth="8"
                    strokeDasharray={`${(s.overallScore ?? 0) * 2.51} 251`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>{s.overallScore ?? 0}</span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Score</span>
                </div>
              </div>
              <p className="text-xs font-semibold mt-2" style={{ color: overallColor }}>{s.overallRating ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "Followers", value: (s.followers ?? 0).toLocaleString(), color: "#5B8DEF" },
            { icon: Heart, label: "Avg Likes", value: (s.avgLikes ?? 0).toLocaleString(), color: "#EC4899" },
            { icon: TrendingUp, label: "Engagement", value: `${s.engagementRate ?? 0}%`, color: "#10B981" },
            { icon: Eye, label: "Est. Reach", value: (s.estimatedReach ?? 0).toLocaleString(), color: "#7C3AED" },
          ].map((stat) => (
            <div key={stat.label} className="surface-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <p className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Follower Quality */}
            <div className="surface-card p-6">
              <h3 className="font-bold text-lg mb-4" style={{ color: "var(--text-primary)" }}>Audience Quality</h3>
              <div className="flex items-center gap-4 mb-4">
                <FakeBadge percentage={s.fakeFollowerPercentage ?? 0} rating={s.followerQualityRating ?? "—"} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-xl text-center" style={{ background: "var(--bg-muted)" }}>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{(s.postsCount ?? 0).toLocaleString()}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Posts</p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: "var(--bg-muted)" }}>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{s.postFrequency ?? 0}/wk</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Frequency</p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: "var(--bg-muted)" }}>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{s.totalCollaborations ?? 0}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Collabs</p>
                </div>
              </div>
            </div>

            {/* Content Breakdown */}
            {s.contentTypes && (
              <div className="surface-card p-6">
                <h3 className="font-bold text-lg mb-4" style={{ color: "var(--text-primary)" }}>Content Breakdown</h3>
                <div className="flex gap-4">
                  <div className="flex-1 p-4 rounded-xl text-center" style={{ background: "#FDF2F8" }}>
                    <Film className="w-6 h-6 mx-auto mb-2" style={{ color: "#EC4899" }} />
                    <p className="font-bold text-lg" style={{ color: "#EC4899" }}>{s.contentTypes.reel ?? 0}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Reels</p>
                  </div>
                  <div className="flex-1 p-4 rounded-xl text-center" style={{ background: "#EFF6FF" }}>
                    <Camera className="w-6 h-6 mx-auto mb-2" style={{ color: "#5B8DEF" }} />
                    <p className="font-bold text-lg" style={{ color: "#5B8DEF" }}>{s.contentTypes.post ?? 0}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Posts</p>
                  </div>
                  <div className="flex-1 p-4 rounded-xl text-center" style={{ background: "#F0FDF4" }}>
                    <ImageIcon className="w-6 h-6 mx-auto mb-2" style={{ color: "#10B981" }} />
                    <p className="font-bold text-lg" style={{ color: "#10B981" }}>{s.contentTypes.carousel ?? 0}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Carousels</p>
                  </div>
                </div>
              </div>
            )}

            {/* Featured Works */}
            {kit.featuredWorks && kit.featuredWorks.length > 0 && (
              <div className="surface-card p-6">
                <h3 className="font-bold text-lg mb-4" style={{ color: "var(--text-primary)" }}>Featured Work</h3>
                <div className="space-y-3">
                  {kit.featuredWorks.map((work: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "var(--bg-muted)" }}>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "var(--blue-light)" }}>
                        <Bookmark className="w-5 h-5" style={{ color: "var(--blue)" }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{work.title}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{work.brandName} — {work.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonials */}
            {kit.testimonials && kit.testimonials.length > 0 && (
              <div className="surface-card p-6">
                <h3 className="font-bold text-lg mb-4" style={{ color: "var(--text-primary)" }}>Brand Testimonials</h3>
                <div className="space-y-4">
                  {kit.testimonials.map((t: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl" style={{ background: "var(--bg-muted)" }}>
                      <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="w-4 h-4" fill={j < t.rating ? "#F59E0B" : "none"} stroke={j < t.rating ? "#F59E0B" : "#CBD5E1"} />
                        ))}
                      </div>
                      <p className="text-sm italic mb-2" style={{ color: "var(--text-secondary)" }}>"{t.quote}"</p>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>— {t.brandName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Rate Card & CTA */}
          <div className="space-y-6">
            {/* Rate Card */}
            <div className="surface-card p-6" style={{ background: "linear-gradient(135deg, var(--blue-light), #FFFFFF)" }}>
              <h3 className="font-bold text-lg mb-4" style={{ color: "var(--text-primary)" }}>Rate Card</h3>
              <div className="space-y-3">
                {[
                  { label: "Instagram Post", value: kit.rateCard.perPost },
                  { label: "Instagram Story", value: kit.rateCard.perStory },
                  { label: "Instagram Reel", value: kit.rateCard.perReel },
                  { label: "Video", value: kit.rateCard.perVideo },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between p-3 rounded-xl bg-white">
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{r.label}</span>
                    <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                      {r.value ? `Rs.${parseFloat(r.value.toString()).toLocaleString()}` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Book CTA */}
            <div className="surface-card p-6 text-center" style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))" }}>
              <h3 className="font-bold text-white mb-2">Book This Creator</h3>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>Available for collaborations on Social Mitraa</p>
              <button onClick={() => navigate("/onboarding?type=brand")} className="w-full py-3 rounded-xl bg-white font-bold text-sm transition-transform hover:scale-105" style={{ color: "var(--blue)" }}>
                Send Collaboration Request
              </button>
            </div>

            {/* Achievements */}
            {kit.achievements && kit.achievements.length > 0 && (
              <div className="surface-card p-6">
                <h3 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Achievements</h3>
                <div className="space-y-2">
                  {kit.achievements.map((a: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--blue)" }} />
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t" style={{ background: "white", borderColor: "var(--border-light)" }}>
        <div className="section-container text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Powered by Social Mitraa — India's Creator-Brand Intelligence Platform</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>&copy; 2026 Social Mitraa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

import { useEffect } from "react";

function FakeBadge({ percentage, rating }: { percentage: number; rating: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    Excellent: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
    Good: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
    Average: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
    Poor: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
    Suspicious: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  };
  const c = colors[rating] ?? colors.Average;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {rating === "Excellent" || rating === "Good" ? <ShieldCheck className="w-4 h-4" /> : rating === "Average" ? <Shield className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
      {rating} — {percentage}% fake est.
    </div>
  );
}
