import { useNavigate } from "react-router";
import { ArrowLeft, Sparkles, Target, Users, Zap, Shield } from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="bg-white border-b" style={{ borderColor: "var(--border-light)" }}>
        <div className="section-container py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 nav-blue">
              <ArrowLeft className="w-4 h-4" /> Back to home
            </button>
            <img src="/logo.png" alt="Social Mitraa" className="h-8 w-auto" />
          </div>
        </div>
      </div>

      <div className="section-container py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-extrabold text-4xl mb-6 text-center" style={{ color: "var(--text-primary)" }}>
            About <span className="text-blue-gradient">Social Mitraa</span>
          </h1>
          <p className="text-lg text-center mb-16" style={{ color: "var(--text-secondary)" }}>
            India's most intelligent creator-brand collaboration platform
          </p>

          {/* Mission */}
          <div className="surface-card p-8 lg:p-10 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--blue-light)" }}>
                <Sparkles className="w-5 h-5" style={{ color: "var(--blue)" }} />
              </div>
              <h2 className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>Our Mission</h2>
            </div>
            <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Social Mitraa was founded with a simple belief: every brand deserves the perfect creator voice, and every creator deserves fair opportunities. We are building India's most intelligent platform that connects brands with content creators using AI-powered matchmaking, making collaborations seamless, transparent, and rewarding for both sides.
            </p>
          </div>

          {/* What We Do */}
          <div className="surface-card p-8 lg:p-10 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-light)" }}>
                <Target className="w-5 h-5" style={{ color: "var(--accent)" }} />
              </div>
              <h2 className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>What We Do</h2>
            </div>
            <p className="leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
              Social Mitraa operates as a full-stack influencer marketing platform with three core offerings:
            </p>
            <div className="space-y-4">
              {[
                { title: "AI-Powered Matching", desc: "Our adaptive algorithm analyzes 42 creator categories, engagement patterns, and predicted ROI to find the perfect brand-creator match every time." },
                { title: "Paid Collaborations", desc: "Brands post campaigns with budgets. Creators apply. Our escrow-protected payment system ensures everyone gets paid fairly and on time." },
                { title: "Barter Collaborations", desc: "Brands offer products or services in exchange for authentic content. Creators receive free products and create reels, posts, and stories." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--blue)" }} />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { icon: Users, label: "Creators", value: "50,000+" },
              { icon: Target, label: "Brands", value: "5,000+" },
              { icon: Zap, label: "Campaigns", value: "25,000+" },
              { icon: Shield, label: "Categories", value: "42+" },
            ].map((stat) => (
              <div key={stat.label} className="surface-card p-6 text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--blue)" }} />
                <p className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Why Choose Us */}
          <div className="surface-card p-8 lg:p-10 mb-10">
            <h2 className="font-bold text-xl mb-6" style={{ color: "var(--text-primary)" }}>Why Creators & Brands Choose Us</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "No Middlemen", desc: "Connect directly with brands or creators. No agencies taking a cut." },
                { title: "Instant Payouts", desc: "Get paid within 48 hours via secure UPI transfers." },
                { title: "AI Match Scoring", desc: "7-factor compatibility scoring for the best partnerships." },
                { title: "Barter Options", desc: "Product-for-content exchanges for emerging creators." },
                { title: "Escrow Protection", desc: "Your payment is held safely until work is delivered." },
                { title: "Full Transparency", desc: "Clear requirements, fair rates, and open communication." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ background: "var(--blue-light)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="surface-card p-8 lg:p-10">
            <h2 className="font-bold text-xl mb-4" style={{ color: "var(--text-primary)" }}>Get in Touch</h2>
            <p className="leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
              Have questions or want to partner with us? Reach out to our team.
            </p>
            <div className="space-y-2">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Email: <span style={{ color: "var(--blue)" }}>support@socialmitraa.com</span></p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Instagram: <span style={{ color: "var(--blue)" }}>@socialmitraofficial</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t" style={{ background: "white", borderColor: "var(--border-light)" }}>
        <div className="section-container text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>&copy; 2026 Social Mitraa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
