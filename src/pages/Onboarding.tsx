import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import { Building2, UserCircle, ArrowRight } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const updateRole = useMutation({
    mutationFn: (role: string) => authApi.updateRole(role),
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login");
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "brand" || type === "influencer") handleRoleSelect(type);
  }, [searchParams]);

  const handleRoleSelect = async (role: "brand" | "influencer") => {
    if (!user) { navigate("/login"); return; }
    try {
      await updateRole.mutateAsync(role);
      if (role === "brand") navigate("/onboarding/brand");
      else navigate("/onboarding/influencer");
    } catch (error) { console.error("Failed:", error); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}><div className="w-8 h-8 border-2 border-[#5B8DEF] border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, var(--bg-primary) 100%)" }}>
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Social Mitraa" className="h-14 w-auto mx-auto mb-4" />
          <h1 className="font-bold text-3xl mb-3" style={{ color: "var(--text-primary)" }}>Welcome! Let's get started</h1>
          <p style={{ color: "var(--text-muted)" }}>Choose how you want to use Social Mitraa</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <button onClick={() => handleRoleSelect("brand")} disabled={updateRole.isPending} className="surface-card p-8 text-left group hover:-translate-y-1 transition-all disabled:opacity-50">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors" style={{ background: "var(--blue-light)" }}>
              <Building2 className="w-7 h-7" style={{ color: "var(--blue)" }} />
            </div>
            <h3 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>I'm a Brand</h3>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-muted)" }}>I want to find creators, post requirements, and use AI matching for my brand campaigns.</p>
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--blue)" }}>
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
          <button onClick={() => handleRoleSelect("influencer")} disabled={updateRole.isPending} className="surface-card p-8 text-left group hover:-translate-y-1 transition-all disabled:opacity-50">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors" style={{ background: "var(--accent-light)" }}>
              <UserCircle className="w-7 h-7" style={{ color: "var(--accent)" }} />
            </div>
            <h3 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>I'm a Creator</h3>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-muted)" }}>I want to find brand deals, set my rates, and get AI-matched with brands.</p>
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
        <div className="text-center mt-8">
          <button onClick={() => navigate("/")} className="text-sm transition-colors" style={{ color: "var(--text-muted)" }}>Back to home</button>
        </div>
      </div>
    </div>
  );
}
