import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight, ChevronLeft, ChevronRight, Instagram, Twitter, Linkedin,
  Menu, X, LayoutDashboard, Brain, Zap, Users, Megaphone, Gift,
  Play, Sparkles, TrendingUp, Handshake, Star,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─── Animated Particle Canvas ─── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const particles: { x: number; y: number; r: number; dx: number; dy: number; alpha: number }[] = [];

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const createParticles = () => {
      particles.length = 0;
      const count = Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 12000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          r: Math.random() * 2 + 0.5,
          dx: (Math.random() - 0.5) * 0.4,
          dy: (Math.random() - 0.5) * 0.4 - 0.2,
          alpha: Math.random() * 0.6 + 0.2,
        });
      }
    };

    resize();
    createParticles();
    window.addEventListener("resize", () => { resize(); createParticles(); });

    const draw = () => {
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;
      ctx.clearRect(0, 0, cw, ch);

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = cw;
        if (p.x > cw) p.x = 0;
        if (p.y < 0) p.y = ch;
        if (p.y > ch) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(91, 141, 239, ${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0, left: 0, width: "100%", height: "100%",
        pointerEvents: "none",
        zIndex: 2,
      }}
    />
  );
}

/* ─── Floating Orbs ─── */
function FloatingOrbs() {
  return (
    <>
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] animate-orb-float"
        style={{ background: "var(--blue)", top: "-10%", left: "-5%", zIndex: 1 }} />
      <div className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[80px] animate-orb-float2"
        style={{ background: "var(--accent)", bottom: "10%", right: "-5%", zIndex: 1 }} />
      <div className="absolute w-[300px] h-[300px] rounded-full opacity-10 blur-[60px] animate-orb-float3"
        style={{ background: "#7C3AED", top: "40%", right: "20%", zIndex: 1 }} />
    </>
  );
}

const FEATURES = [
  { icon: <Brain className="w-6 h-6" />, title: "AI Smart Matching", desc: "Our adaptive algorithm learns from every match. 42 creator categories with relation scoring, 7-factor adaptive weighting, and predicted ROI in real-time.", color: "#5B8DEF" },
  { icon: <Zap className="w-6 h-6" />, title: "Instant Payouts", desc: "Get paid within 48 hours via secure UPI transfers. Escrow-protected transactions with automated invoice generation.", color: "#F59E0B" },
  { icon: <TrendingUp className="w-6 h-6" />, title: "Creator Discovery", desc: "Browse 50,000+ verified creators with powerful filters. Find the perfect match for any campaign, any niche.", color: "#10B981" },
  { icon: <Handshake className="w-6 h-6" />, title: "Barter Exchange", desc: "Trade products for authentic content. Zero cash investment for brands, free products for creators.", color: "#EC4899" },
];

const HOW_STEPS = [
  { num: "01", title: "Create Your Profile", desc: "Sign up as a brand or creator. Add your details, social links, and preferences in under 3 minutes." },
  { num: "02", title: "Post or Browse", desc: "Brands post campaigns or barter deals. Creators set rate cards and browse opportunities matched by AI." },
  { num: "03", title: "AI Finds Your Match", desc: "Our engine scores 7 factors and surfaces the top matches with compatibility scores — in seconds." },
  { num: "04", title: "Collaborate & Grow", desc: "Connect directly, create amazing content, and receive instant payouts through our secure gateway." },
];

const TESTIMONIALS = [
  { quote: "Social Mitraa's AI matching found us the perfect creators for our Diwali campaign. The compatibility scores were incredibly accurate.", name: "Priya Sharma", role: "Marketing Head, Nykaa", rating: 5 },
  { quote: "I've 3x'd my brand deals since joining. The instant payouts changed everything — no more waiting 90 days.", name: "Rohan Mehta", role: "Lifestyle Creator, 250K followers", rating: 5 },
  { quote: "We specify exactly what we want — reel type, creator niche, budget — and Social Mitraa delivers matched creators within minutes.", name: "Vikram Patel", role: "CEO, D2C Startup", rating: 5 },
];

const CATEGORIES = ["Fashion", "Beauty", "Fitness", "Food", "Travel", "Lifestyle", "Technology", "Finance", "Education", "Gaming", "Parenting", "Photography", "Art", "Music", "Dance", "Comedy", "Business", "Health", "Sports", "Luxury"];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, dashboardPath } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tIdx, setTIdx] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Mouse parallax for hero
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 20, y: y * 20 });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // GSAP scroll animations
  useEffect(() => {
    if (!sectionsRef.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-a]").forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        });
      });
      // Parallax for images
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        gsap.to(el, {
          yPercent: -15,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
        });
      });
    }, sectionsRef);
    return () => ctx.revert();
  }, []);

  // Auto-advance testimonials
  useEffect(() => {
    const iv = setInterval(() => setTIdx((p) => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>

      {/* ═══ NAVBAR ═══ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/80 backdrop-blur-2xl shadow-lg shadow-blue-900/5" : "bg-transparent"}`}>
        <div className="section-container">
          <div className="flex items-center justify-between h-20">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Social Mitraa" className="h-10 w-auto" />
            </button>
            <div className="hidden lg:flex items-center gap-8">
              {["Features", "How It Works", "Categories", "Barter", "Reviews"].map((l) => (
                <button key={l} onClick={() => document.querySelector(`#${l.toLowerCase().replace(/ /g, "-")}`)?.scrollIntoView({ behavior: "smooth" })} className="nav-blue">
                  {l}
                </button>
              ))}
              <button onClick={() => navigate("/pricing")} className="nav-blue font-semibold">Pricing</button>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <button onClick={() => navigate(dashboardPath)} className="nav-blue flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> Dashboard</button>
                  <button onClick={logout} className="nav-blue text-sm">Logout</button>
                </>
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
        {mobileOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-2xl mx-4 mt-2 p-6 rounded-3xl shadow-2xl border" style={{ borderColor: "var(--border-light)" }}>
            <div className="flex flex-col gap-3">
              {["Features", "How It Works", "Categories", "Barter", "Reviews"].map((l) => (
                <button key={l} onClick={() => { document.querySelector(`#${l.toLowerCase().replace(/ /g, "-")}`)?.scrollIntoView({ behavior: "smooth" }); setMobileOpen(false); }} className="text-left text-sm font-medium py-2" style={{ color: "var(--text-secondary)" }}>{l}</button>
              ))}
              <button onClick={() => { navigate("/pricing"); setMobileOpen(false); }} className="text-left text-sm font-semibold py-2" style={{ color: "var(--blue)" }}>Pricing</button>
              <hr style={{ borderColor: "var(--border-light)" }} />
              <button onClick={() => navigate("/login")} className="text-left text-sm font-medium py-2" style={{ color: "var(--text-secondary)" }}>Log in</button>
              <button onClick={() => navigate("/onboarding")} className="btn-primary-blue text-center">Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image with parallax */}
        <div
          className="absolute inset-0 z-0"
          style={{
            transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px) scale(1.1)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          <img src="/hero-collab.jpg" alt="Brand collaborating with influencer" className="w-full h-full object-cover" />
        </div>
        {/* Gradient overlays */}
        <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(135deg, rgba(26,31,54,0.88) 0%, rgba(26,31,54,0.65) 40%, rgba(91,141,239,0.25) 100%)" }} />
        <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(to top, var(--bg-primary) 0%, transparent 20%)" }} />
        <FloatingOrbs />
        <ParticleCanvas />

        {/* Hero content */}
        <div className="section-container relative z-10 pt-28 pb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div data-a>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase mb-8 animate-pulse-glow"
                style={{ background: "rgba(91,141,239,0.2)", color: "#93BBFD", border: "1px solid rgba(91,141,239,0.3)" }}>
                <Sparkles className="w-3.5 h-3.5" /> India's #1 Creator-Brand Platform
              </div>
              <h1 className="font-extrabold leading-[1.05] mb-7 text-white" style={{ fontSize: "clamp(2.8rem, 5.5vw, 4.5rem)" }}>
                Where creators meet brands, powered by{" "}
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #5B8DEF, #93BBFD)" }}>AI intelligence</span>
              </h1>
              <p className="text-lg leading-relaxed mb-10 max-w-lg" style={{ color: "rgba(255,255,255,0.7)" }}>
                Post your requirements. Our adaptive AI matches you with the perfect creators — scoring 42 categories, engagement quality, and predicted ROI in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => navigate("/onboarding")} className="btn-primary-blue">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => { navigate("/barter"); }} className="px-8 py-4 rounded-2xl font-bold text-sm transition-all inline-flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                  <Gift className="w-4 h-4" /> Explore Barter
                </button>
              </div>
            </div>
            {/* Right side - floating card */}
            <div className="hidden lg:block relative" data-a>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/30 border border-white/10"
                style={{ transform: `translate(${mousePos.x * -1}px, ${mousePos.y * -1}px)`, transition: "transform 0.3s ease-out" }}>
                <img src="/collab-wide.jpg" alt="Collaboration" className="w-full object-cover" style={{ maxHeight: 420 }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,31,54,0.8) 0%, transparent 50%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--blue)" }}>
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">See how it works</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>2 min video</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 px-4 py-3 rounded-2xl backdrop-blur-xl border border-white/20 animate-float"
                style={{ background: "rgba(91,141,239,0.9)" }}>
                <p className="text-xs font-bold text-white">AI Match Found</p>
                <p className="text-[10px] text-white/80">95% compatible</p>
              </div>
              <div className="absolute -bottom-4 -left-4 px-4 py-3 rounded-2xl backdrop-blur-xl border border-white/20 animate-float"
                style={{ background: "rgba(245,158,11,0.9)", animationDelay: "1.5s" }}>
                <p className="text-xs font-bold text-white">Instant Payout</p>
                <p className="text-[10px] text-white/80">48 hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-24 lg:py-32">
        <div className="section-container" ref={sectionsRef}>
          <div className="text-center mb-16" data-a>
            <div className="section-badge mb-5">Platform Features</div>
            <h2 className="font-extrabold mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
              Everything you need to <span className="text-blue-gradient">collaborate & grow</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              A complete toolkit for brands and creators to discover, connect, and transact seamlessly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-a>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="group relative surface-card p-8 lg:p-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                  style={{ background: f.color, filter: "blur(40px)", transform: "translate(30%, -30%)" }} />
                <div className="flex items-start gap-5 mb-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${f.color}15`, color: f.color }}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">{f.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-24 lg:py-32 relative overflow-hidden" style={{ background: "var(--bg-muted)" }}>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-5 blur-[120px]" style={{ background: "var(--blue)" }} />
        <div className="section-container relative">
          <div className="text-center mb-16" data-a>
            <div className="section-badge-blue mb-5">How It Works</div>
            <h2 className="font-extrabold" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
              From signup to success in <span className="text-blue-gradient">4 steps</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-a>
            {HOW_STEPS.map((step, i) => (
              <div key={step.num} className="relative group">
                <div className="surface-card p-8 h-full relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 text-8xl font-black opacity-[0.03] select-none">{step.num}</div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))" }}>
                    {step.num}
                  </div>
                  <h3 className="font-bold text-lg mb-3">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.desc}</p>
                </div>
                {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5" style={{ background: "var(--blue)" }} />} 
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section id="categories" className="py-24 lg:py-32" style={{ background: "var(--bg-primary)" }}>
        <div className="section-container">
          <div className="text-center mb-14" data-a>
            <div className="section-badge mb-5">42+ Categories</div>
            <h2 className="font-extrabold mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
              Every creator <span className="text-blue-gradient">niche</span>, covered
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Our AI uses category relations to find creators with adjacent expertise.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3" data-a>
            {CATEGORIES.map((cat) => (
              <span key={cat} className="pill-tag">{cat}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BARTER CTA SECTION ═══ */}
      <section id="barter" className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/hero-collab.jpg" alt="" className="w-full h-full object-cover" data-parallax />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(26,31,54,0.92) 0%, rgba(91,141,239,0.85) 100%)" }} />
        </div>
        <div className="section-container relative z-10" data-a>
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase mb-6"
              style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
              <Gift className="w-3.5 h-3.5" /> New Feature
            </div>
            <h2 className="font-extrabold text-3xl lg:text-4xl text-white mb-5">
              Introducing <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #FCD34D, #F59E0B)" }}>Barter Collaborations</span>
            </h2>
            <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.8)" }}>
              Trade your products for authentic content. Zero cash investment — perfect for launches, reviews, and building long-term creator relationships.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate("/barter")} className="btn-accent">
                Explore Barter <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate("/onboarding?type=brand")} className="px-8 py-4 rounded-2xl font-bold text-sm transition-all border border-white/30 text-white hover:bg-white/10 backdrop-blur-sm inline-flex items-center justify-center gap-2">
                Post a Barter Deal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="reviews" className="py-24 lg:py-32" style={{ background: "var(--bg-muted)" }}>
        <div className="section-container">
          <div className="text-center mb-14" data-a>
            <div className="section-badge mb-5">Creator Reviews</div>
            <h2 className="font-extrabold" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
              Loved by <span className="text-blue-gradient">creators & brands</span> across India
            </h2>
          </div>
          <div className="max-w-2xl mx-auto" data-a>
            <div className="surface-card p-8 lg:p-10 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-8xl font-serif opacity-[0.05] select-none">"</div>
              <div className="flex gap-1 mb-5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5" fill="#F59E0B" stroke="#F59E0B" />
                ))}
              </div>
              <p className="text-lg italic leading-relaxed mb-8 min-h-[80px]" style={{ color: "var(--text-primary)" }}>
                "{TESTIMONIALS[tIdx].quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white" style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))" }}>
                  {TESTIMONIALS[tIdx].name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm">{TESTIMONIALS[tIdx].name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{TESTIMONIALS[tIdx].role}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setTIdx((p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)} className="surface-card w-11 h-11 rounded-full flex items-center justify-center hover:shadow-md transition-shadow">
                <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
              </button>
              <div className="flex items-center gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} onClick={() => setTIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === tIdx ? "w-6" : ""}`} style={{ background: i === tIdx ? "var(--blue)" : "var(--border-medium)" }} />
                ))}
              </div>
              <button onClick={() => setTIdx((p) => (p + 1) % TESTIMONIALS.length)} className="surface-card w-11 h-11 rounded-full flex items-center justify-center hover:shadow-md transition-shadow">
                <ChevronRight className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-24 lg:py-36" style={{ background: "linear-gradient(180deg, var(--bg-muted) 0%, var(--blue-light) 100%)" }}>
        <div className="section-container text-center" data-a>
          <h2 className="font-extrabold mb-5" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
            Ready to transform your <br /><span className="text-blue-gradient">creator partnerships?</span>
          </h2>
          <p className="text-lg mb-10 max-w-lg mx-auto" style={{ color: "var(--text-secondary)" }}>
            Join thousands of creators and brands already growing together with AI-powered matching.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/onboarding?type=influencer")} className="btn-primary-blue">
              <Users className="w-4 h-4" /> Join as Creator
            </button>
            <button onClick={() => navigate("/onboarding?type=brand")} className="btn-accent">
              <Megaphone className="w-4 h-4" /> Join as Brand
            </button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-16" style={{ background: "#0F1629", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <img src="/logo.png" alt="Social Mitraa" className="h-10 w-auto mb-4 brightness-200" />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>India's Creator-Brand Intelligence Platform with AI-powered matchmaking.</p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-white">Platform</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => navigate("/onboarding?type=influencer")} className="text-sm cursor-pointer transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>For Creators</button></li>
                <li><button onClick={() => navigate("/onboarding?type=brand")} className="text-sm cursor-pointer transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>For Brands</button></li>
                <li><button onClick={() => navigate("/pricing")} className="text-sm cursor-pointer transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>Pricing</button></li>
                <li><button onClick={() => navigate("/barter")} className="text-sm cursor-pointer transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>Barter Collaborations</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-white">Company</h4>
              <ul className="space-y-2.5">
                {["About", "Careers", "Blog", "Contact"].map((item) => (
                  <li key={item}><button onClick={() => item === "About" ? navigate("/about") : undefined} className="text-sm cursor-pointer transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>{item}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-white">Legal</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => navigate("/terms")} className="text-sm cursor-pointer transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>Terms of Service</button></li>
                <li><button onClick={() => navigate("/privacy")} className="text-sm cursor-pointer transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>Privacy Policy</button></li>
                <li><button onClick={() => navigate("/terms")} className="text-sm cursor-pointer transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>Cookie Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>&copy; 2026 Social Mitraa. All rights reserved.</p>
            <div className="flex gap-4">
              {[{ i: Instagram, h: "https://www.instagram.com/socialmitraofficial" }, { i: Twitter, h: "#" }, { i: Linkedin, h: "#" }].map(({ i: Icon, h }) => (
                <a key={h} href={h} target={h.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.3)" }} className="hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
