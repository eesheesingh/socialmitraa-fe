import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Gift, Camera, Star, CheckCircle2,
  Menu, X, LayoutDashboard, Package, Hash, Users,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HOW_BARTER_WORKS = [
  { num: "1", title: "Brand Posts a Product", desc: "List your product or service with details, content requirements, and influencer criteria. Set how many creators you need." },
  { num: "2", title: "Influencers Discover & Apply", desc: "Creators browse available barter deals and apply for ones that match their niche and audience." },
  { num: "3", title: "Brand Ships the Product", desc: "Once approved, the brand ships the product directly to the influencer's address." },
  { num: "4", title: "Influencer Creates Content", desc: "The creator uses the product, creates authentic reels/posts/stories, and publishes with brand tags." },
];

const BARTER_BENEFITS = [
  { icon: "🎁", title: "Zero Cash Investment", desc: "Trade products for authentic content. Perfect for startups and D2C brands testing influencer marketing." },
  { icon: "📱", title: "Authentic UGC Content", desc: "Get genuine user-generated content from real creators who actually use your products." },
  { icon: "🚀", title: "Launch New Products", desc: "Generate buzz before launch by sending products to creators in your niche for reviews and unboxing." },
  { icon: "🤝", title: "Build Relationships", desc: "Start with barter, then convert top-performing creators into long-term paid brand ambassadors." },
];

export default function BarterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, dashboardPath } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sectionsRef = useRef<HTMLDivElement>(null);

  const { data: openDeals } = useQuery({
    queryKey: ["barters", "open-deals"],
    queryFn: () => apiClient.get("/barters/open-deals"),
  });

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    if (!sectionsRef.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-a]").forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 30 }, {
          opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
        });
      });
    }, sectionsRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm" : "bg-transparent"}`}>
        <div className="section-container">
          <div className="flex items-center justify-between h-20">
            <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Social Mitraa" className="h-10 w-auto" />
            </button>
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate(dashboardPath)} className="nav-blue flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> Dashboard</button>
                  <button onClick={logout} className="nav-blue text-sm">Logout</button>
                </div>
              ) : (
                <>
                  <button onClick={() => navigate("/login")} className="nav-blue font-semibold">Log in</button>
                  <button onClick={() => navigate("/onboarding")} className="nav-blue-active">Get Started</button>
                </>
              )}
            </div>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden" style={{ color: "var(--text-primary)" }}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, var(--bg-primary) 100%)" }}>
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div data-a>
              <div className="section-badge mb-8">
                <Gift className="w-3.5 h-3.5 mr-2" style={{ color: "var(--accent)" }} />
                Product for Content Exchange
              </div>
              <h1 className="font-extrabold leading-[1.05] mb-7" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "var(--text-primary)" }}>
                Barter collaborations that{" "}
                <span className="text-blue-gradient">grow both sides</span>
              </h1>
              <p className="text-lg leading-relaxed mb-10 max-w-lg" style={{ color: "var(--text-secondary)" }}>
                Brands offer products. Creators make content. No money exchanges hands — just authentic storytelling and real product experiences.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => navigate("/onboarding?type=brand")} className="btn-primary-blue">
                  Post a Barter Deal <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate("/onboarding?type=influencer")} className="btn-outline-blue">
                  Browse Barter Deals
                </button>
              </div>
            </div>
            <div className="relative" data-a>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Package, label: "Products Shipped", value: "10,000+", color: "var(--blue-light)", iconColor: "var(--blue)" },
                  { icon: Camera, label: "Reels Created", value: "25,000+", color: "var(--accent-light)", iconColor: "var(--accent)" },
                  { icon: Users, label: "Active Creators", value: "8,000+", color: "var(--blue-light)", iconColor: "var(--blue)" },
                  { icon: Star, label: "Avg Rating", value: "4.8/5", color: "var(--accent-light)", iconColor: "var(--accent)" },
                ].map((stat) => (
                  <div key={stat.label} className="surface-card p-6 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: stat.color }}>
                      <stat.icon className="w-6 h-6" style={{ color: stat.iconColor }} />
                    </div>
                    <p className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Barter Works */}
      <section className="py-24 lg:py-32" style={{ background: "var(--bg-muted)" }}>
        <div className="section-container" ref={sectionsRef}>
          <div className="text-center mb-16" data-a>
            <div className="section-badge-blue mb-5">How It Works</div>
            <h2 className="font-extrabold" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "var(--text-primary)" }}>
              Barter in <span className="text-blue-gradient">4 simple steps</span>
            </h2>
          </div>
          <div className="relative max-w-4xl mx-auto" data-a>
            <div className="hidden md:block absolute left-8 top-16 bottom-16 w-0.5" style={{ background: "var(--border-light)" }} />
            <div className="space-y-12">
              {HOW_BARTER_WORKS.map((step, i) => (
                <div key={step.num} className="relative flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                  <div className="flex-shrink-0 z-10">
                    <div className={`step-circle ${i >= 2 ? "step-circle-blue" : ""}`}>{step.num}</div>
                  </div>
                  <div className="surface-card p-8 flex-1">
                    <h3 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 lg:py-32" style={{ background: "var(--bg-primary)" }}>
        <div className="section-container">
          <div className="text-center mb-16" data-a>
            <div className="section-badge mb-5">Why Barter?</div>
            <h2 className="font-extrabold mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "var(--text-primary)" }}>
              Benefits for <span className="text-blue-gradient">brands & creators</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-a>
            {BARTER_BENEFITS.map((b) => (
              <div key={b.title} className="surface-card p-8">
                <div className="flex items-start gap-5">
                  <div className="text-3xl flex-shrink-0">{b.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>{b.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{b.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Barter Deals */}
      <section className="py-24 lg:py-32" style={{ background: "linear-gradient(180deg, var(--blue-light) 0%, var(--bg-primary) 100%)" }}>
        <div className="section-container">
          <div className="text-center mb-14" data-a>
            <div className="section-badge mb-5">Live Barter Deals</div>
            <h2 className="font-extrabold mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "var(--text-primary)" }}>
              Open deals you can <span className="text-blue-gradient">apply now</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-a>
            {openDeals && openDeals.length > 0 ? openDeals.slice(0, 6).map((deal) => (
              <div key={deal.id} className="surface-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--blue-light)" }}>
                    <Package className="w-6 h-6" style={{ color: "var(--blue)" }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{deal.productName}</h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{deal.brand?.brandName ?? deal.brand?.companyName ?? "Brand"}</p>
                  </div>
                </div>
                {deal.productDescription && (
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{deal.productDescription}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {deal.contentType && (deal.contentType as string[]).map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "var(--blue-light)", color: "var(--blue)" }}>{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{deal.slotsFilled}/{deal.slotsTotal} slots</span>
                  {deal.productValue && <span>Value: Rs.{parseFloat(deal.productValue.toString()).toLocaleString()}</span>}
                </div>
                <button onClick={() => navigate("/onboarding?type=influencer")} className="w-full py-2.5 rounded-xl text-xs font-semibold transition-colors" style={{ background: "var(--blue-light)", color: "var(--blue)" }}>
                  Apply as Creator
                </button>
              </div>
            )) : (
              <div className="col-span-full surface-card p-16 text-center">
                <Gift className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--border-medium)" }} />
                <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>No Open Deals Yet</h3>
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Be the first to post a barter deal!</p>
                <button onClick={() => navigate("/onboarding?type=brand")} className="btn-primary-blue">Post a Barter Deal</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-36" style={{ background: "linear-gradient(180deg, var(--bg-primary) 0%, var(--accent-light) 100%)" }}>
        <div className="section-container text-center" data-a>
          <h2 className="font-extrabold mb-5" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "var(--text-primary)" }}>
            Ready to start <span className="text-blue-gradient">bartering?</span>
          </h2>
          <p className="text-lg mb-10 max-w-lg mx-auto" style={{ color: "var(--text-secondary)" }}>
            Whether you are a brand with products to share or a creator looking for collaborations, barter is the perfect starting point.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/onboarding?type=brand")} className="btn-primary-blue">
              <Package className="w-4 h-4" /> Post Product for Barter
            </button>
            <button onClick={() => navigate("/onboarding?type=influencer")} className="btn-accent">
              <Camera className="w-4 h-4" /> Apply as Creator
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16" style={{ background: "white", borderTop: "1px solid var(--border-light)" }}>
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/logo.png" alt="Social Mitraa" className="h-10 w-auto" />
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>India's Creator-Brand Intelligence Platform with AI-powered matchmaking.</p>
            </div>
            {[
              { t: "Platform", items: ["For Creators", "For Brands", "AI Matching", "Barter"] },
              { t: "Company", items: ["About", "Careers", "Blog", "Contact"] },
              { t: "Legal", items: ["Terms", "Privacy", "Cookies"] },
            ].map((col) => (
              <div key={col.t}>
                <h4 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>{col.t}</h4>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item}><span className="text-sm cursor-pointer transition-colors hover:text-blue" style={{ color: "var(--text-secondary)" }}>{item}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8" style={{ borderTop: "1px solid var(--border-light)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>&copy; 2026 Social Mitraa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
