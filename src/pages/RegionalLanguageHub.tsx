import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Globe, Search, MapPin, Users, TrendingUp, Sparkles,
  Filter, ChevronDown, Star, Megaphone, BarChart3, RefreshCw,
  Languages, Layers, IndianRupee, MessageCircle, CheckCircle,
  ExternalLink, Hash, ArrowUpRight,
} from "lucide-react";

const LANGUAGE_META: Record<string, { name: string; native: string; speakers: string; color: string }> = {
  hindi: { name: "Hindi", native: "हिन्दी", speakers: "600M+", color: "bg-orange-100 text-orange-600" },
  tamil: { name: "Tamil", native: "தமிழ்", speakers: "80M+", color: "bg-red-100 text-red-600" },
  telugu: { name: "Telugu", native: "తెలుగు", speakers: "95M+", color: "bg-sky-100 text-sky-600" },
  marathi: { name: "Marathi", native: "मराठी", speakers: "99M+", color: "bg-yellow-100 text-yellow-700" },
  gujarati: { name: "Gujarati", native: "ગુજરાતી", speakers: "62M+", color: "bg-emerald-100 text-emerald-600" },
  bengali: { name: "Bengali", native: "বাংলা", speakers: "265M+", color: "bg-pink-100 text-pink-600" },
  kannada: { name: "Kannada", native: "ಕನ್ನಡ", speakers: "60M+", color: "bg-amber-100 text-amber-700" },
  malayalam: { name: "Malayalam", native: "മലയാളം", speakers: "38M+", color: "bg-teal-100 text-teal-600" },
  punjabi: { name: "Punjabi", native: "ਪੰਜਾਬੀ", speakers: "125M+", color: "bg-green-100 text-green-600" },
  english: { name: "English", native: "English", speakers: "200M+", color: "bg-blue-100 text-blue-600" },
  hinglish: { name: "Hinglish", native: "Hinglish", speakers: "350M+", color: "bg-indigo-100 text-indigo-600" },
  urdu: { name: "Urdu", native: "اردو", speakers: "70M+", color: "bg-violet-100 text-violet-600" },
  odia: { name: "Odia", native: "ଓଡ଼ିଆ", speakers: "45M+", color: "bg-rose-100 text-rose-600" },
  assamese: { name: "Assamese", native: "অসমীয়া", speakers: "23M+", color: "bg-cyan-100 text-cyan-600" },
};

const TIER_LABELS: Record<string, string> = {
  tier1: "Tier 1 (Metro)", tier2: "Tier 2 (Cities)", tier3: "Tier 3 (Towns)", rural: "Rural",
};

function CreatorCard({ creator, onContact }: { creator: any; onContact: (c: any) => void }) {
  const lang = creator.primaryLanguage;
  const meta = LANGUAGE_META[lang] ?? LANGUAGE_META.english;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all group">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg font-bold text-blue-600 flex-shrink-0">
          {creator.name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800 truncate">{creator.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
              {meta.native}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{creator.bio ?? "No bio available"}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {creator.categories && (creator.categories as string[]).slice(0, 3).map((cat: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs">{cat}</span>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Users size={12} /> {(creator.followerCount ?? 0).toLocaleString()}</span>
            <span className="flex items-center gap-1"><TrendingUp size={12} /> {creator.engagementRate ?? "N/A"}%</span>
            {creator.ratePerPost && (
              <span className="flex items-center gap-1"><IndianRupee size={12} /> {parseFloat(creator.ratePerPost.toString()).toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => onContact(creator)}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <Megaphone size={14} /> Collaborate
        </button>
        <button className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
}

function TrendCard({ trend }: { trend: any }) {
  const statusColors: Record<string, string> = {
    emerging: "bg-blue-100 text-blue-600",
    rising: "bg-emerald-100 text-emerald-600",
    peaking: "bg-amber-100 text-amber-600",
    declining: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-slate-800">{trend.trendName}</h4>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[trend.status] ?? "bg-slate-100 text-slate-600"}`}>
            {trend.status}
          </span>
        </div>
        <ArrowUpRight size={18} className="text-slate-400" />
      </div>
      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{trend.trendDescription}</p>
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1"><TrendingUp size={12} className="text-emerald-500" /> {trend.searchVolumeGrowth}% growth</span>
        <span className="flex items-center gap-1"><Users size={12} className="text-blue-500" /> {trend.creatorCount} creators</span>
      </div>
      {trend.suggestedHashtags && (trend.suggestedHashtags as string[]).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(trend.suggestedHashtags as string[]).slice(0, 4).map((tag: string, i: number) => (
            <span key={i} className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
              <Hash size={10} /> {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RegionalLanguageHub() {
  const navigate = useNavigate();
  const { isBrand } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("hindi");
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [searchNiche, setSearchNiche] = useState("");
  const [activeView, setActiveView] = useState<"creators" | "trends" | "languages">("creators");
  const [showFilters, setShowFilters] = useState(false);

  const { data: languages } = trpc.regional.getLanguages.useQuery();
  const { data: creators, isLoading: creatorsLoading } = trpc.regional.discoverByLanguage.useQuery(
    { language: selectedLanguage as any, tier: selectedTier as any, niche: searchNiche || undefined, page: 1, limit: 20 },
    { enabled: activeView === "creators" }
  );
  const { data: trends, isLoading: trendsLoading } = trpc.regional.getTrends.useQuery(
    { language: selectedLanguage as any, limit: 10 },
    { enabled: activeView === "trends" }
  );
  const { data: vernacularStats } = trpc.regional.vernacularStats.useQuery();

  const handleContact = (creator: any) => {
    if (!isBrand) {
      navigate("/login");
      return;
    }
    navigate(`/brand/dashboard?tab=campaigns&creator=${creator.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-3">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Globe size={24} className="text-blue-600" />
                </div>
                Regional Language Hub
              </h1>
              <p className="text-slate-500 mt-2 ml-15 max-w-xl">
                The world&apos;s first vernacular creator discovery engine. Find creators who speak your audience&apos;s language across 14 Indian languages and every tier city.
              </p>
            </div>
            {vernacularStats && (
              <div className="flex items-center gap-6 bg-white px-5 py-3 rounded-xl border border-slate-200">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{vernacularStats.totalVernacularCreators}</div>
                  <div className="text-xs text-slate-500">Vernacular Creators</div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <div className="text-xl font-bold text-emerald-600">{vernacularStats.languagesSupported}</div>
                  <div className="text-xs text-slate-500">Languages</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(["creators", "trends", "languages"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                activeView === view
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {view === "creators" && <Users size={16} />}
              {view === "trends" && <TrendingUp size={16} />}
              {view === "languages" && <Languages size={16} />}
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        {activeView === "creators" && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* Language Selector */}
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  <span className="text-sm font-medium text-slate-600 flex items-center gap-1"><Languages size={14} /> Language:</span>
                  {languages?.slice(0, 8).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedLanguage === lang.code
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {lang.nativeName}
                    </button>
                  ))}
                  <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                    <Filter size={12} /> More <ChevronDown size={10} />
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Tier:</span>
                    {Object.entries(TIER_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedTier(selectedTier === key ? "" : key)}
                        className={`px-3 py-1 rounded-lg text-xs ${selectedTier === key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Niche:</span>
                    <input
                      type="text"
                      value={searchNiche}
                      onChange={(e) => setSearchNiche(e.target.value)}
                      placeholder="e.g., fashion, food"
                      className="px-3 py-1 border border-slate-200 rounded-lg text-xs w-40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Creator Grid */}
            {creatorsLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <RefreshCw size={24} className="mx-auto text-blue-400 animate-spin mb-3" />
                <p className="text-slate-500">Discovering creators...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-500">
                    Found <span className="font-medium text-slate-700">{creators?.length ?? 0}</span> {LANGUAGE_META[selectedLanguage]?.name ?? selectedLanguage}-speaking creators
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {creators?.map((creator, i) => (
                    <CreatorCard key={i} creator={creator} onContact={handleContact} />
                  ))}
                </div>
                {(!creators || creators.length === 0) && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <Search size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-1">No creators found</h3>
                    <p className="text-sm text-slate-400">Try adjusting your language or filter settings</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeView === "trends" && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-600 flex items-center gap-1"><TrendingUp size={14} /> Trending in:</span>
              {languages?.slice(0, 8).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedLanguage === lang.code
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {lang.nativeName}
                </button>
              ))}
            </div>

            {trendsLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <RefreshCw size={24} className="mx-auto text-blue-400 animate-spin mb-3" />
                <p className="text-slate-500">Loading trends...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {trends?.map((trend, i) => (
                  <TrendCard key={i} trend={trend} />
                ))}
                {(!trends || trends.length === 0) && (
                  <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <TrendingUp size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-1">No trends yet</h3>
                    <p className="text-sm text-slate-400">Regional trends will appear here as they emerge</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeView === "languages" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {languages?.map((lang) => {
              const meta = LANGUAGE_META[lang.code] ?? LANGUAGE_META.english;
              const topLang = vernacularStats?.topLanguages?.find((l: any) => l.language === lang.code);
              return (
                <div
                  key={lang.code}
                  onClick={() => { setSelectedLanguage(lang.code); setActiveView("creators"); }}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${meta.color}`}>
                      {meta.native}
                    </span>
                    <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-lg">{lang.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{meta.speakers} speakers</p>
                  {topLang && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <Users size={14} className="text-blue-500" />
                      <span className="text-sm font-medium text-slate-700">{topLang.count} creators</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
