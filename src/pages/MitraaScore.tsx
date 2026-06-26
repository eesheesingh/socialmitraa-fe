import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import {
  ArrowLeft, RefreshCw, Shield, TrendingUp, TrendingDown, Minus,
  Award, CheckCircle, AlertTriangle, Lightbulb, ChevronRight,
  Star, BarChart3, Users, DollarSign, Activity, Layers, Clock,
  Sparkles,
} from "lucide-react";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  excellent: { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-50", icon: Award },
  good: { label: "Good", color: "text-blue-600", bg: "bg-blue-50", icon: Star },
  average: { label: "Average", color: "text-amber-600", bg: "bg-amber-50", icon: BarChart3 },
  poor: { label: "Poor", color: "text-orange-600", bg: "bg-orange-50", icon: AlertTriangle },
  risk: { label: "Risk", color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
};

const COMPONENT_DETAILS = [
  { key: "audienceQualityScore", label: "Audience Quality", icon: Users, weight: "20%", desc: "Authenticity of your follower base" },
  { key: "engagementAuthenticityScore", label: "Engagement Authenticity", icon: Activity, weight: "15%", desc: "Genuine interactions on content" },
  { key: "brandReliabilityScore", label: "Brand Reliability", icon: Shield, weight: "15%", desc: "On-time delivery & completion rate" },
  { key: "contentConsistencyScore", label: "Content Consistency", icon: Clock, weight: "12.5%", desc: "Posting frequency & regularity" },
  { key: "financialReliabilityScore", label: "Financial Reliability", icon: DollarSign, weight: "12.5%", desc: "Payment history & reliability" },
  { key: "complianceScore", label: "Compliance", icon: CheckCircle, weight: "10%", desc: "Professional standards & guidelines" },
  { key: "growthVelocityScore", label: "Growth Velocity", icon: TrendingUp, weight: "7.5%", desc: "Follower growth trajectory" },
  { key: "platformDiversityScore", label: "Platform Diversity", icon: Layers, weight: "7.5%", desc: "Multi-platform presence" },
];

function ScoreGauge({ score }: { score: number }) {
  const percentage = Math.min(100, (score / 900) * 100);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  let color = "#ef4444";
  if (score >= 750) color = "#10b981";
  else if (score >= 600) color = "#3b82f6";
  else if (score >= 450) color = "#f59e0b";
  else if (score >= 300) color = "#f97316"

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" className="-rotate-90">
        <circle cx="110" cy="110" r={radius} stroke="#f1f5f9" strokeWidth="12" fill="none" />
        <circle cx="110" cy="110" r={radius} stroke={color} strokeWidth="12" fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-bold text-slate-800">{score}</span>
        <span className="text-sm text-slate-500 mt-1">out of 900</span>
      </div>
    </div>
  );
}

export default function CreatorCreditScore() {
  const navigate = useNavigate();
  const { user, isInfluencer } = useAuth();
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: scoreData, isLoading, refetch } = trpc.mitraaScore.myScore.useQuery(undefined, {
    enabled: isInfluencer,
    retry: false,
  });

  const calculateMutation = trpc.mitraaScore.calculate.useMutation({
    onMutate: () => setIsCalculating(true),
    onSettled: () => {
      setIsCalculating(false);
      refetch();
    },
  });

  const handleCalculate = () => {
    if (!isInfluencer) return;
    calculateMutation.mutate();
  };

  if (!isInfluencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-8">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Shield size={64} className="mx-auto text-blue-300 mb-6" />
            <h1 className="text-2xl font-bold text-slate-800 mb-3">Mitraa Score</h1>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              This feature is exclusively for creators. Login as a creator to view and calculate your Mitraa Score.
            </p>
            <button onClick={() => navigate("/login")} className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
              Login as Creator
            </button>
          </div>
        </div>
      </div>
    );
  }

  const score = scoreData?.overallScore ?? 0;
  const category = scoreData?.category ?? "poor";
  const components = scoreData?.components ?? {};
  const catConfig = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.poor;
  const CatIcon = catConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate("/influencer/dashboard")} className="flex items-center gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isCalculating ? "animate-spin" : ""} />
            {isCalculating ? "Calculating..." : "Recalculate Score"}
          </button>
        </div>

        {/* Score Hero */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-shrink-0">
              <ScoreGauge score={score} />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center gap-3 mb-3 justify-center lg:justify-start">
                <h1 className="text-2xl font-bold text-slate-800">Mitraa Score</h1>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${catConfig.bg} ${catConfig.color}`}>
                  <CatIcon size={14} /> {catConfig.label}
                </span>
              </div>
              <p className="text-slate-500 mb-4">
                India's first creator trust score — your collaboration reliability score based on 8 key factors.
                Brands use this to evaluate your professionalism.
              </p>
              {scoreData?.scoreChange !== 0 && (
                <div className="flex items-center gap-4 justify-center lg:justify-start">
                  <span className="flex items-center gap-1 text-sm">
                    {(scoreData?.scoreChange ?? 0) > 0 ? (
                      <><TrendingUp size={14} className="text-emerald-500" /> <span className="text-emerald-600 font-medium">+{scoreData?.scoreChange} this week</span></>
                    ) : (scoreData?.scoreChange ?? 0) < 0 ? (
                      <><TrendingDown size={14} className="text-red-500" /> <span className="text-red-600 font-medium">{scoreData?.scoreChange} this week</span></>
                    ) : (
                      <><Minus size={14} className="text-slate-400" /> <span className="text-slate-500">No change</span></>
                    )}
                  </span>
                  <span className="text-xs text-slate-400">
                    Next update: {scoreData?.nextCalculationAt ? new Date(scoreData.nextCalculationAt).toLocaleDateString() : "7 days"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <RefreshCw size={32} className="mx-auto text-blue-400 animate-spin mb-4" />
            <p className="text-slate-500">Loading your Mitraa Score...</p>
          </div>
        ) : !scoreData ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Sparkles size={48} className="mx-auto text-blue-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No Score Yet</h2>
            <p className="text-slate-500 mb-6">Calculate your Mitraa Score to see how brands view your collaboration reliability.</p>
            <button onClick={handleCalculate} className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
              Calculate My Score
            </button>
          </div>
        ) : (
          <>
            {/* Component Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-500" /> Score Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COMPONENT_DETAILS.map((comp) => {
                  const value = (components as any)?.[comp.key] ?? 0;
                  const CompIcon = comp.icon;
                  let barColor = "bg-red-400";
                  if (value >= 80) barColor = "bg-emerald-400";
                  else if (value >= 60) barColor = "bg-blue-400";
                  else if (value >= 40) barColor = "bg-amber-400";
                  else if (value >= 20) barColor = "bg-orange-400";

                  return (
                    <div key={comp.key} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <CompIcon size={18} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{comp.label}</span>
                          <span className="text-xs text-slate-400">{comp.weight}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                          <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${value}%` }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{comp.desc}</span>
                          <span className="text-sm font-semibold text-slate-700">{value}/100</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Positive & Negative Factors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" /> Positive Factors
                </h3>
                <ul className="space-y-3">
                  {(scoreData.positiveFactors ?? []).map((factor: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <ChevronRight size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      {factor}
                    </li>
                  ))}
                  {(scoreData.positiveFactors ?? []).length === 0 && (
                    <p className="text-sm text-slate-400 italic">Complete collaborations to build positive factors</p>
                  )}
                </ul>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Lightbulb size={18} className="text-amber-500" /> Improvement Tips
                </h3>
                <ul className="space-y-3">
                  {(scoreData.improvementTips ?? []).map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <Sparkles size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                  {(scoreData.improvementTips ?? []).length === 0 && (
                    <p className="text-sm text-slate-400 italic">You&apos;re doing great! Keep collaborating.</p>
                  )}
                </ul>
              </div>
            </div>

            {/* Score Interpretation */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Award size={18} /> How Brands See Your Score
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const isActive = key === category;
                  return (
                    <div key={key} className={`rounded-xl p-3 text-center ${isActive ? "bg-white/20 ring-2 ring-white/40" : "bg-white/10"}`}>
                      <Icon size={20} className="mx-auto mb-1 opacity-80" />
                      <div className="text-xs font-medium opacity-90">{cfg.label}</div>
                      <div className="text-xs opacity-60 mt-0.5">
                        {key === "excellent" ? "750-900" : key === "good" ? "600-749" : key === "average" ? "450-599" : key === "poor" ? "300-449" : "0-299"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
