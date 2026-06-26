import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, Check, X, Sparkles, Zap, Crown, Building2, UserCircle,
  Star, TrendingUp, Megaphone, Percent, Gift, ShieldCheck, BarChart3,
  Rocket, Gem, IndianRupee, RotateCcw,
} from "lucide-react";

// 20% discount on yearly = monthly × 12 × 0.80
const fmt = (n: number) => n.toLocaleString("en-IN");

const BRAND_PLANS = [
  {
    id: "free", name: "Starter", icon: Rocket,
    monthly: 0,
    desc: "Perfect for trying out the platform",
    commission: "15%",
    features: [
      { text: "1 active campaign", included: true },
      { text: "Basic creator search", included: true },
      { text: "Barter collaborations", included: true },
      { text: "AI matching", included: false },
      { text: "ROI tracking", included: false },
      { text: "Affiliate system", included: false },
      { text: "Featured campaigns", included: false },
      { text: "Analytics dashboard", included: false },
    ],
    cta: "Start Free", ctaStyle: "outline" as const,
    popular: false,
  },
  {
    id: "growth", name: "Growth", icon: Zap,
    monthly: 2999,
    desc: "For growing brands ready to scale",
    commission: "10%",
    features: [
      { text: "5 active campaigns", included: true },
      { text: "Advanced creator search", included: true },
      { text: "Barter collaborations", included: true },
      { text: "AI-powered matching", included: true },
      { text: "Featured campaigns", included: true },
      { text: "Basic analytics", included: true },
      { text: "ROI tracking", included: false },
      { text: "Affiliate system", included: false },
    ],
    cta: "Start Growing", ctaStyle: "primary" as const,
    popular: true,
  },
  {
    id: "pro", name: "Pro", icon: Crown,
    monthly: 7999,
    desc: "Everything you need for serious marketing",
    commission: "8%",
    features: [
      { text: "Unlimited campaigns", included: true },
      { text: "Advanced creator search", included: true },
      { text: "Barter collaborations", included: true },
      { text: "Priority AI matching", included: true },
      { text: "Featured campaigns", included: true },
      { text: "Full analytics suite", included: true },
      { text: "ROI tracking & reports", included: true },
      { text: "Affiliate system", included: true },
    ],
    cta: "Go Pro", ctaStyle: "accent" as const,
    popular: false,
  },
  {
    id: "enterprise", name: "Enterprise", icon: Gem,
    monthly: 24999,
    desc: "For large brands and agencies",
    commission: "5%",
    features: [
      { text: "Unlimited campaigns", included: true },
      { text: "Priority AI matching", included: true },
      { text: "Barter + Affiliate + ROI", included: true },
      { text: "Featured campaigns", included: true },
      { text: "Full analytics suite", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "White-label media kits", included: true },
    ],
    cta: "Contact Sales", ctaStyle: "dark" as const,
    popular: false,
  },
];

const CREATOR_PLANS = [
  {
    id: "free", name: "Free", icon: UserCircle,
    monthly: 0,
    desc: "Start your creator journey",
    features: [
      { text: "Basic profile", included: true },
      { text: "Apply to campaigns", included: true },
      { text: "Barter deals", included: true },
      { text: "Affiliate programs", included: true },
      { text: "Verified badge", included: false },
      { text: "Media kit page", included: false },
      { text: "Priority in AI matching", included: false },
      { text: "Tax invoices", included: false },
    ],
    cta: "Join Free", ctaStyle: "outline" as const,
    popular: false,
  },
  {
    id: "verified", name: "Verified", icon: ShieldCheck,
    monthly: 499,
    desc: "Get noticed by top brands",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Blue verified badge", included: true, highlight: true },
      { text: "Public media kit page", included: true, highlight: true },
      { text: "Priority in AI matching", included: true },
      { text: "Instagram analytics", included: true },
      { text: "Fake follower report", included: true },
      { text: "Featured placement", included: false },
      { text: "Tax invoices", included: false },
    ],
    cta: "Get Verified", ctaStyle: "primary" as const,
    popular: true,
  },
  {
    id: "pro", name: "Pro Creator", icon: Star,
    monthly: 999,
    desc: "For professional creators",
    features: [
      { text: "Everything in Verified", included: true },
      { text: "Featured placement", included: true, highlight: true },
      { text: "Early campaign access", included: true, highlight: true },
      { text: "Tax invoice generation", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Creator community access", included: true },
      { text: "Priority support", included: true },
      { text: "Monthly earnings report", included: true },
    ],
    cta: "Go Pro", ctaStyle: "accent" as const,
    popular: false,
  },
];

const ADDONS = [
  { icon: Megaphone, name: "Featured Campaign", price: "\u20B9499", desc: "Appear at top of creator feed for 7 days" },
  { icon: Gift, name: "Barter Deal Listing", price: "\u20B999 - \u20B9499", desc: "Post product-for-content exchanges" },
  { icon: Percent, name: "Affiliate Program", price: "2 - 3%", desc: "Platform fee on every affiliate sale" },
  { icon: TrendingUp, name: "Instant Payout", price: "2%", desc: "Get paid immediately instead of 48 hours" },
  { icon: BarChart3, name: "Campaign Report", price: "\u20B9999", desc: "Detailed ROI and performance analysis" },
  { icon: ShieldCheck, name: "Content License", price: "\u20B9499 - \u20B99,999", desc: "Usage rights for brand content reuse" },
];

function yearlyPrice(monthly: number): number {
  if (monthly === 0) return 0;
  return Math.round(monthly * 12 * 0.80); // 20% off yearly
}

function PricingCard({ plan, billing, type }: { plan: typeof BRAND_PLANS[0]; billing: "monthly" | "yearly"; type: "brand" | "creator" }) {
  const navigate = useNavigate();
  const { isAuthenticated, isBrand, isInfluencer } = useAuth();

  const handleCta = () => {
    if (!isAuthenticated) { navigate(`/onboarding?type=${type}`); return; }
    if (type === "brand" && isBrand) navigate("/brand/dashboard");
    else if (type === "creator" && isInfluencer) navigate("/influencer/dashboard");
    else navigate("/onboarding");
  };

  const ctaClasses: Record<string, string> = {
    outline: "btn-outline-blue",
    primary: "btn-primary-blue",
    accent: "btn-accent",
    dark: "px-8 py-4 rounded-2xl font-bold text-sm transition-all inline-flex items-center justify-center gap-2 bg-[#1E293B] text-white hover:bg-[#334155]",
  };

  const price = billing === "monthly" ? plan.monthly : yearlyPrice(plan.monthly);
  const periodLabel = billing === "monthly" ? "/month" : "/year";
  const yearlyEquiv = billing === "yearly" && plan.monthly > 0 ? Math.round(yearlyPrice(plan.monthly) / 12) : 0;

  return (
    <div className={`relative surface-card p-8 h-full flex flex-col ${plan.popular ? "ring-2 ring-[#5B8DEF] shadow-xl shadow-blue-900/10" : ""}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #5B8DEF, #3458A0)" }}>
          Most Popular
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: plan.popular ? "var(--blue-light)" : "var(--bg-muted)" }}>
          <plan.icon className="w-5 h-5" style={{ color: plan.popular ? "var(--blue)" : "var(--text-muted)" }} />
        </div>
        <div>
          <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{plan.desc}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <IndianRupee className="w-6 h-6" style={{ color: "var(--text-primary)" }} />
          <span className="font-extrabold text-3xl" style={{ color: "var(--text-primary)" }}>{fmt(price)}</span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{periodLabel}</span>
        </div>
        {billing === "yearly" && plan.monthly > 0 && (
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            <span className="line-through">₹{fmt(plan.monthly * 12)}</span>{" "}
            <span style={{ color: "#10B981" }}>Save 20%</span>
            {" "}(₹{fmt(yearlyEquiv)}/mo equivalent)
          </p>
        )}
        {billing === "monthly" && plan.monthly > 0 && (
          <p className="text-xs mt-1" style={{ color: "var(--blue)" }}>
            ₹{fmt(yearlyPrice(plan.monthly))}/year with 20% off
          </p>
        )}
        {"commission" in plan && (
          <p className="text-xs mt-2 font-semibold" style={{ color: "var(--accent)" }}>
            {(plan as any).commission} commission per deal
          </p>
        )}
      </div>

      <div className="space-y-3 mb-8 flex-1">
        {plan.features.map((f: any, i: number) => (
          <div key={i} className="flex items-start gap-2.5">
            {f.included ? (
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: f.highlight ? "var(--blue)" : "#10B981" }} />
            ) : (
              <X className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            )}
            <span className={`text-sm ${!f.included ? "line-through" : ""}`} style={{ color: f.included ? "var(--text-secondary)" : "var(--text-muted)" }}>
              {f.text}
            </span>
          </div>
        ))}
      </div>

      <button onClick={handleCta} className={`w-full ${ctaClasses[plan.ctaStyle]}`}>
        {plan.cta}
      </button>
    </div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

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

      <div className="section-container py-16 lg:py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="section-badge mb-5">Pricing</div>
          <h1 className="font-extrabold mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "var(--text-primary)" }}>
            Simple, transparent <span className="text-blue-gradient">pricing</span>
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Start free. Scale as you grow. No hidden fees. All prices in INR.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 mt-8 p-1.5 rounded-full border" style={{ background: "var(--bg-muted)", borderColor: "var(--border-light)" }}>
            <button
              onClick={() => setBilling("monthly")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${billing === "monthly" ? "bg-white shadow-sm text-[#1E293B]" : "text-[#94A3B8]"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${billing === "yearly" ? "bg-white shadow-sm text-[#1E293B]" : "text-[#94A3B8]"}`}
            >
              Yearly
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: "#10B981" }}>SAVE 20%</span>
            </button>
          </div>
        </div>

        {/* Brand Plans */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <div className="flex items-center gap-2 justify-center mb-3">
              <Building2 className="w-5 h-5" style={{ color: "var(--blue)" }} />
              <h2 className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>For Brands</h2>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Find creators, run campaigns, track ROI</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BRAND_PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} billing={billing} type="brand" />
            ))}
          </div>
        </div>

        {/* Creator Plans */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <div className="flex items-center gap-2 justify-center mb-3">
              <UserCircle className="w-5 h-5" style={{ color: "var(--accent)" }} />
              <h2 className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>For Creators</h2>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Get discovered, verified, and paid</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {CREATOR_PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} billing={billing} type="creator" />
            ))}
          </div>
        </div>

        {/* Commission & Fees */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <div className="section-badge mb-5">Platform Fees</div>
            <h2 className="font-bold text-2xl mb-4" style={{ color: "var(--text-primary)" }}>Additional Revenue Streams</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADDONS.map((addon) => (
              <div key={addon.name} className="surface-card p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--blue-light)" }}>
                  <addon.icon className="w-6 h-6" style={{ color: "var(--blue)" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{addon.name}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>{addon.price}</span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{addon.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 1 Launch Offer */}
        <div className="rounded-3xl p-10 lg:p-14 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #5B8DEF 0%, #3458A0 100%)" }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "white", filter: "blur(60px)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: "#F59E0B", filter: "blur(50px)", transform: "translate(-30%, 30%)" }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase mb-6" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
              <Sparkles className="w-3.5 h-3.5" /> Phase 1 Launch Offer
            </div>
            <h2 className="font-extrabold text-3xl lg:text-4xl text-white mb-4">
              0% Commission on Your First 3 Campaigns
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
              New brands pay zero commission on their first 3 campaigns. Start collaborating risk-free and experience the power of AI-driven creator matching.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate("/onboarding?type=brand")} className="px-8 py-4 rounded-2xl font-bold text-sm bg-white transition-all hover:scale-105" style={{ color: "var(--blue)" }}>
                Claim Your Free Campaigns
              </button>
              <button onClick={() => navigate("/onboarding?type=influencer")} className="px-8 py-4 rounded-2xl font-bold text-sm border border-white/30 text-white hover:bg-white/10 transition-all">
                Join as Creator
              </button>
            </div>
            <p className="text-xs mt-6" style={{ color: "rgba(255,255,255,0.5)" }}>Limited time offer. No credit card required.</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="font-bold text-2xl text-center mb-10" style={{ color: "var(--text-primary)" }}>Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "How does the commission work?", a: "We charge a percentage of each paid collaboration. For example, on the Growth plan, if a brand pays a creator \u20B950,000, our commission is 10% (\u20B95,000) and the creator receives \u20B945,000." },
              { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel anytime. Your subscription remains active until the end of the current billing period." },
              { q: "What happens after the free plan limit?", a: "On the free brand plan, you can run 1 active campaign at a time. To run more campaigns simultaneously, upgrade to Growth or Pro." },
              { q: "Is the verified badge worth it for creators?", a: "Verified creators receive 3-5x more collaboration requests. The blue badge signals credibility and shows brands that your audience is authentic." },
              { q: "How does the Phase 1 offer work?", a: "New brands get 0% commission on their first 3 paid campaigns. After that, your plan's commission rate applies. No credit card required to start." },
              { q: "What is the 20% yearly discount?", a: "When you choose yearly billing, you get 20% off compared to paying monthly. For example, Growth yearly is \u20B928,790 instead of \u20B935,988 (12 x \u20B92,999)." },
            ].map((faq, i) => (
              <div key={i} className="surface-card p-6">
                <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--text-primary)" }}>{faq.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GST Disclaimer */}
      <div className="max-w-2xl mx-auto px-6 mb-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Percent size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">18% GST Applicable</p>
            <p className="text-xs text-amber-600 mt-1">All prices shown above are exclusive of 18% GST. GST will be added at checkout/payment. For example, the Growth plan at Rs.2,999/month will have Rs.540 GST added, making the total Rs.3,539/month.</p>
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
