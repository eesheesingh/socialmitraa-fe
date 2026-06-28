import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  ArrowLeft, MessageSquare, Send, Bot, User, CheckCircle, XCircle, Clock,
  TrendingUp, Shield, IndianRupee, ChevronRight,
  Sparkles, Handshake, RefreshCw,
} from "lucide-react";

type TabType = "active" | "completed" | "new";

function NegotiationChat({ sessionId, onClose }: { sessionId: number; onClose: () => void }) {
  const { isBrand, isInfluencer } = useAuth();
  const [counterRate, setCounterRate] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const queryClient = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ["negotiations", sessionId],
    queryFn: () => apiClient.get<any>(`/negotiations/${sessionId}`),
    enabled: !!sessionId,
  });

  const brandAcceptMutation = useMutation({
    mutationFn: ({ sessionId }: { sessionId: number }) =>
      apiClient.post<any>(`/negotiations/${sessionId}/accept`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["negotiations", sessionId] }),
  });
  const brandCounterMutation = useMutation({
    mutationFn: ({ sessionId, counterRate }: { sessionId: number; counterRate: number }) =>
      apiClient.post<any>(`/negotiations/${sessionId}/counter`, { counterOffer: counterRate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negotiations", sessionId] });
      setShowCounter(false);
      setCounterRate("");
    },
  });
  const creatorRespondMutation = useMutation({
    mutationFn: ({ sessionId, action, counterRate }: { sessionId: number; action: string; counterRate?: number }) =>
      apiClient.post<any>(`/negotiations/${sessionId}/respond`, { responseType: action, counterOffer: counterRate }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["negotiations", sessionId] }),
  });

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  const messages = (session.messages as any[]) ?? [];
  const agreedRate = parseFloat(session.agreedRate?.toString() ?? session.aiSuggestedRate?.toString() ?? "0");
  const isActive = !["both_accepted", "rejected", "expired"].includes(session.status);

  const handleCreatorAccept = () => {
    creatorRespondMutation.mutate({ sessionId, action: "accept" });
  };

  const handleCreatorCounter = () => {
    const rate = parseFloat(counterRate);
    if (!rate || rate <= 0) return;
    creatorRespondMutation.mutate({ sessionId, action: "counter", counterRate: rate });
  };

  const handleCreatorReject = () => {
    creatorRespondMutation.mutate({ sessionId, action: "reject" });
  };

  const handleBrandAccept = () => {
    brandAcceptMutation.mutate({ sessionId });
  };

  const handleBrandCounter = () => {
    const rate = parseFloat(counterRate);
    if (!rate || rate <= 0) return;
    brandCounterMutation.mutate({ sessionId, counterRate: rate });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Handshake size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">AI Negotiation</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className={`px-2 py-0.5 rounded-full ${session.status === "both_accepted" ? "bg-emerald-100 text-emerald-600" : isActive ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                {session.status.replace("_", " ").toUpperCase()}
              </span>
              {session.expiresAt && (
                <span className="flex items-center gap-1"><Clock size={10} /> Expires {new Date(session.expiresAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle size={20} /></button>
      </div>

      {/* AI Reasoning Banner */}
      {session.aiReasoning && (
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
          <Sparkles size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs font-medium text-amber-700">AI Market Analysis</span>
            <p className="text-xs text-amber-600 mt-0.5">{session.aiReasoning}</p>
          </div>
        </div>
      )}

      {/* Rate Summary */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">Brand Budget</div>
          <div className="text-sm font-semibold text-slate-700 flex items-center justify-center gap-0.5">
            <IndianRupee size={12} />{parseFloat(session.brandBudgetMin?.toString() ?? "0").toLocaleString()} - {parseFloat(session.brandBudgetMax?.toString() ?? "0").toLocaleString()}
          </div>
        </div>
        <div className="text-center border-x border-slate-200">
          <div className="text-xs text-slate-500 mb-1">AI Suggested</div>
          <div className="text-sm font-semibold text-blue-600 flex items-center justify-center gap-0.5">
            <IndianRupee size={12} />{agreedRate.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">Market Rate</div>
          <div className="text-sm font-semibold text-emerald-600 flex items-center justify-center gap-0.5">
            <IndianRupee size={12} />{parseFloat(session.marketBenchmarkRate?.toString() ?? "0").toLocaleString()}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="px-6 py-4 h-80 overflow-y-auto space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.sender === (isBrand ? "brand" : "creator") ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.sender === "ai" ? "bg-purple-100" : msg.sender === "brand" ? "bg-blue-100" : "bg-emerald-100"
            }`}>
              {msg.sender === "ai" ? <Bot size={14} className="text-purple-600" /> :
               msg.sender === "brand" ? <User size={14} className="text-blue-600" /> :
               <User size={14} className="text-emerald-600" />}
            </div>
            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.sender === (isBrand ? "brand" : "creator")
                ? "bg-blue-600 text-white"
                : msg.sender === "ai"
                ? "bg-purple-50 text-purple-800 border border-purple-100"
                : "bg-slate-100 text-slate-700"
            }`}>
              {msg.message}
              <div className={`text-xs mt-1 ${msg.sender === (isBrand ? "brand" : "creator") ? "text-blue-200" : "text-slate-400"}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {isActive && (
        <div className="px-6 py-4 border-t border-slate-100">
          {showCounter ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  value={counterRate}
                  onChange={(e) => setCounterRate(e.target.value)}
                  placeholder="Enter counter offer amount"
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={isBrand ? handleBrandCounter : handleCreatorCounter}
                disabled={!counterRate}
                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send size={14} /> Send Counter
              </button>
              <button onClick={() => setShowCounter(false)} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={isBrand ? handleBrandAccept : handleCreatorAccept}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} /> Accept Rs.{agreedRate.toLocaleString()}
              </button>
              <button
                onClick={() => setShowCounter(true)}
                className="flex-1 bg-amber-50 text-amber-700 border border-amber-200 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-100 flex items-center justify-center gap-2"
              >
                <TrendingUp size={16} /> Counter Offer
              </button>
              {isInfluencer && (
                <button
                  onClick={handleCreatorReject}
                  className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 flex items-center gap-2"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {session.status === "both_accepted" && (
        <div className="px-6 py-4 border-t border-emerald-100 bg-emerald-50 flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-600" />
          <div>
            <span className="text-sm font-medium text-emerald-800">Deal Finalized!</span>
            <span className="text-sm text-emerald-600 ml-2">Agreed rate: Rs.{agreedRate.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AINegotiation() {
  const navigate = useNavigate();
  const { isBrand, isInfluencer } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["negotiations", "mine"],
    queryFn: () => apiClient.get<any>("/negotiations"),
    enabled: !!(isBrand || isInfluencer),
  });

  const activeSessions = sessions?.filter((s: any) => !["both_accepted", "rejected", "expired"].includes(s.status)) ?? [];
  const completedSessions = sessions?.filter((s: any) => ["both_accepted", "rejected", "expired"].includes(s.status)) ?? [];

  if (!isBrand && !isInfluencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-8">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Bot size={64} className="mx-auto text-blue-300 mb-6" />
            <h1 className="text-2xl font-bold text-slate-800 mb-3">AI Negotiation Bot</h1>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Login as a brand or creator to use the AI-powered negotiation system.
            </p>
            <button onClick={() => navigate("/login")} className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => isBrand ? navigate("/brand/dashboard") : navigate("/influencer/dashboard")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-3"
            >
              <ArrowLeft size={18} /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Bot size={20} className="text-blue-600" />
              </div>
              AI Negotiation Bot
            </h1>
            <p className="text-slate-500 mt-1 ml-13">AI-powered rate negotiation with market benchmarking</p>
          </div>
        </div>

        {/* How it Works */}
        {!selectedSession && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Shield, title: "Market Analysis", desc: "AI analyzes follower count, engagement, niche & Mitraa Score" },
              { icon: MessageSquare, title: "Smart Negotiation", desc: "Real-time AI mediation between brand and creator" },
              { icon: CheckCircle, title: "Fair Deal", desc: "Both parties get data-backed fair market rate" },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{step.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedSession ? (
          <NegotiationChat
            sessionId={selectedSession}
            onClose={() => setSelectedSession(null)}
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
              {(["active", "completed"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tab === "active" ? `Active (${activeSessions.length})` : `Completed (${completedSessions.length})`}
                </button>
              ))}
            </div>

            {/* Session List */}
            {isLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <RefreshCw size={24} className="mx-auto text-blue-400 animate-spin mb-3" />
                <p className="text-slate-500">Loading negotiations...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(activeTab === "active" ? activeSessions : completedSessions).map((session: any) => {
                  const agreedRate = parseFloat(session.agreedRate?.toString() ?? session.aiSuggestedRate?.toString() ?? "0");
                  return (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSession(session.id)}
                      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            session.status === "both_accepted" ? "bg-emerald-100" :
                            session.status === "rejected" ? "bg-red-100" : "bg-blue-100"
                          }`}>
                            {session.status === "both_accepted" ? <CheckCircle size={22} className="text-emerald-600" /> :
                             session.status === "rejected" ? <XCircle size={22} className="text-red-600" /> :
                             <Handshake size={22} className="text-blue-600" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">Campaign #{session.campaignId}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                session.status === "both_accepted" ? "bg-emerald-100 text-emerald-600" :
                                session.status === "rejected" ? "bg-red-100 text-red-600" :
                                session.status === "ai_negotiating" ? "bg-blue-100 text-blue-600" :
                                "bg-amber-100 text-amber-600"
                              }`}>
                                {session.status.replace("_", " ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><IndianRupee size={10} /> AI Suggested: {agreedRate.toLocaleString()}</span>
                              <span className="flex items-center gap-1"><Clock size={10} /> {new Date(session.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  );
                })}

                {(activeTab === "active" ? activeSessions : completedSessions).length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-1">No {activeTab} negotiations</h3>
                    <p className="text-sm text-slate-400">
                      {activeTab === "active"
                        ? isBrand ? "Start a negotiation from a campaign page" : "Wait for brands to initiate negotiations"
                        : "Completed negotiations will appear here"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
