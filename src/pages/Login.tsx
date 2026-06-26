import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { authApi, getOAuthUrl } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { LogIn, ArrowLeft, Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, refresh, dashboardPath } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onAuthSuccess = async () => {
    await refresh();
    navigate(dashboardPath);
  };

  const loginMut = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: onAuthSuccess,
    onError: (e: Error) => setError(e.message),
  });
  const registerMut = useMutation({
    mutationFn: () => authApi.register(name, email, password),
    onSuccess: onAuthSuccess,
    onError: (e: Error) => setError(e.message),
  });

  const pending = loginMut.isPending || registerMut.isPending;

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate(dashboardPath);
  }, [isLoading, isAuthenticated, navigate, dashboardPath]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "login") {
      loginMut.mutate();
    } else {
      registerMut.mutate();
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}><div className="w-8 h-8 border-2 border-[#5B8DEF] border-t-transparent rounded-full animate-spin" /></div>;
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, var(--bg-primary) 100%)" }}>
      <div className="max-w-sm w-full">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm mb-8 transition-colors" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Social Mitraa" className="h-14 w-auto mx-auto mb-4" />
          <h1 className="font-bold text-2xl mb-2" style={{ color: "var(--text-primary)" }}>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{mode === "login" ? "Sign in to access your dashboard" : "Sign up to get started"}</p>
        </div>
        <div className="card-surface p-8">
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <Input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            )}
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 8 : undefined} />
            {error && <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>}
            <button type="submit" disabled={pending} className="w-full btn-primary-blue flex items-center justify-center gap-2 disabled:opacity-60">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: "var(--text-muted)" }}>
            {mode === "login" ? "New here? " : "Already have an account? "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="font-medium hover:underline" style={{ color: "var(--blue)" }}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--border-light, #E5E7EB)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-light, #E5E7EB)" }} />
          </div>

          <button onClick={() => { window.location.href = getOAuthUrl(); }} className="w-full btn-outline-blue flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" /> Sign in with Kimi
          </button>
          <p className="text-xs text-center mt-6" style={{ color: "var(--text-muted)" }}>By continuing, you agree to our Terms and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
