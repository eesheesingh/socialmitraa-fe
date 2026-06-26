import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import { trpc } from "@/providers/trpc";
import {
  Building2, ArrowRight, ArrowLeft, Check, Brain,
  Megaphone, DollarSign, Users, Camera, Film, Image, BarChart3,
} from "lucide-react";

const INDUSTRIES = [
  "Fashion & Apparel", "Beauty & Personal Care", "Food & Beverage", "Technology",
  "Health & Wellness", "Travel & Hospitality", "Finance & Insurance", "Education",
  "Entertainment", "Real Estate", "Automotive", "E-Commerce", "D2C Brand",
  "Media & Publishing", "Sports & Fitness", "Home & Living", "Other",
];

const TEAM_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];
const BUDGET_RANGES = ["Under Rs.10K", "Rs.10K-50K", "Rs.50K-2L", "Rs.2L-10L", "Rs.10L+"];

const CREATOR_CATEGORIES = [
  "Fashion", "Beauty", "Fitness", "Food", "Travel", "Lifestyle",
  "Technology", "Finance", "Education", "Gaming", "Parenting",
  "Photography", "Art", "Music", "Dance", "Comedy", "Motivation",
  "Business", "Health & Wellness", "Sports", "Automotive", "Real Estate",
  "Pets", "DIY & Crafts", "Book & Literature", "News & Politics",
  "Science", "Environment", "Relationships", "Luxury", "Review & Unboxing",
  "Event Coverage", "Cooking & Recipes", "Home Decor", "Gardening",
  "Astrology", "Legal Advice", "Medical & Health", "Entertainment",
  "Vlogging", "Podcasting",
];

const CONTENT_TYPES = [
  { id: "reel", label: "Reel / Short Video", icon: Film },
  { id: "post", label: "Static Post", icon: Image },
  { id: "story", label: "Story", icon: Camera },
  { id: "video", label: "Long Video", icon: Megaphone },
  { id: "review", label: "Review / Unboxing", icon: BarChart3 },
  { id: "live", label: "Live Session", icon: Users },
];

export default function BrandOnboarding() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isBrand } = useAuth();
  const updateProfile = trpc.brand.updateProfile.useMutation();
  const createRequirement = trpc.match.createRequirement.useMutation();
  const runMatching = trpc.match.runMatching.useMutation();
  const completeOnboarding = useMutation({
    mutationFn: () => authApi.completeOnboarding(),
  });
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    companyName: "", brandName: "", industry: "", website: "",
    description: "", email: "", phone: "", location: "", city: "",
    teamSize: "", budgetRange: "",
  });
  const [requirement, setRequirement] = useState({
    campaignTitle: "",
    campaignDescription: "",
    contentTypes: [] as string[],
    creatorCategories: [] as string[],
    minFollowers: 0,
    maxFollowers: 0,
    minEngagementRate: 0,
    preferredPlatforms: [] as string[],
    budgetPerCreator: 0,
    totalBudget: 0,
    creatorsNeeded: 1,
    minReachExpected: 0,
    minLikesExpected: 0,
    preferredLocation: "",
  });
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login");
    if (!isLoading && isAuthenticated && !isBrand) navigate("/onboarding");
  }, [isLoading, isAuthenticated, isBrand, navigate]);

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const updateReq = (field: string, value: unknown) => {
    setRequirement((prev) => ({ ...prev, [field]: value }));
  };
  const toggleContentType = (id: string) => {
    setRequirement((prev) => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(id)
        ? prev.contentTypes.filter((c) => c !== id)
        : [...prev.contentTypes, id],
    }));
  };
  const toggleCreatorCat = (cat: string) => {
    setRequirement((prev) => ({
      ...prev,
      creatorCategories: prev.creatorCategories.includes(cat)
        ? prev.creatorCategories.filter((c) => c !== cat)
        : [...prev.creatorCategories, cat],
    }));
  };
  const togglePlatform = (pid: string) => {
    setRequirement((prev) => ({
      ...prev,
      preferredPlatforms: prev.preferredPlatforms.includes(pid)
        ? prev.preferredPlatforms.filter((p) => p !== pid)
        : [...prev.preferredPlatforms, pid],
    }));
  };

  const handleSubmit = async () => {
    try {
      await updateProfile.mutateAsync(formData);
      // Create requirement
      const reqRes = await createRequirement.mutateAsync({
        ...requirement,
        minFollowers: requirement.minFollowers || undefined,
        maxFollowers: requirement.maxFollowers || undefined,
        minEngagementRate: requirement.minEngagementRate || undefined,
        budgetPerCreator: requirement.budgetPerCreator || undefined,
        totalBudget: requirement.totalBudget || undefined,
        creatorsNeeded: requirement.creatorsNeeded,
        minReachExpected: requirement.minReachExpected || undefined,
        minLikesExpected: requirement.minLikesExpected || undefined,
      });
      // Run AI matching
      if (reqRes.requirementId) {
        setMatching(true);
        await runMatching.mutateAsync({ requirementId: reqRes.requirementId });
        setMatching(false);
      }
      await completeOnboarding.mutateAsync();
      navigate("/brand/dashboard");
    } catch (error) {
      console.error("Failed:", error);
      setMatching(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated || !isBrand) return null;

  const steps = [
    {
      title: "Company Basics",
      description: "Tell us about your company.",
      canProceed: formData.companyName.length > 0,
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">Company Name <span className="text-red-400">*</span></label>
            <input type="text" value={formData.companyName} onChange={(e) => updateField("companyName", e.target.value)} placeholder="e.g., Nykaa" className="input-elegant" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">Brand Name</label>
            <input type="text" value={formData.brandName} onChange={(e) => updateField("brandName", e.target.value)} placeholder="Your brand name" className="input-elegant" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">Industry</label>
            <select value={formData.industry} onChange={(e) => updateField("industry", e.target.value)} className="select-elegant">
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Email</label>
              <input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="brand@company.com" className="input-elegant" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Phone</label>
              <input type="tel" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+91..." className="input-elegant" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Company Details",
      description: "More about your business.",
      canProceed: true,
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} placeholder="What does your company do?" rows={3} className="input-elegant resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Website</label>
              <input type="url" value={formData.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://..." className="input-elegant" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">City</label>
              <input type="text" value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="e.g., Mumbai" className="input-elegant" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Team Size</label>
              <select value={formData.teamSize} onChange={(e) => updateField("teamSize", e.target.value)} className="select-elegant">
                <option value="">Select</option>
                {TEAM_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Monthly Budget</label>
              <select value={formData.budgetRange} onChange={(e) => updateField("budgetRange", e.target.value)} className="select-elegant">
                <option value="">Select</option>
                {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Campaign Requirements",
      description: "Tell us what kind of promotion you want.",
      canProceed: requirement.campaignTitle.length > 0,
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">Campaign Title <span className="text-red-400">*</span></label>
            <input type="text" value={requirement.campaignTitle} onChange={(e) => updateReq("campaignTitle", e.target.value)} placeholder="e.g., Summer Collection Launch" className="input-elegant" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">Campaign Description</label>
            <textarea value={requirement.campaignDescription} onChange={(e) => updateReq("campaignDescription", e.target.value)} placeholder="Describe your campaign goals..." rows={3} className="input-elegant resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">Content Type Needed</label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((ct) => (
                <button key={ct.id} onClick={() => toggleContentType(ct.id)} className={`pill ${requirement.contentTypes.includes(ct.id) ? "pill-selected" : ""}`}>
                  <ct.icon className="w-3.5 h-3.5 inline mr-1" />{ct.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Influencer Requirements",
      description: "What kind of creators are you looking for?",
      canProceed: requirement.creatorCategories.length > 0,
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-3">Creator Categories <span className="text-red-400">*</span> ({requirement.creatorCategories.length} selected)</label>
            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
              {CREATOR_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => toggleCreatorCat(cat)} className={`pill ${requirement.creatorCategories.includes(cat) ? "pill-selected" : ""}`}>
                  {requirement.creatorCategories.includes(cat) && <Check className="w-3 h-3 inline mr-1" />}{cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Preferred Location</label>
              <input type="text" value={requirement.preferredLocation} onChange={(e) => updateReq("preferredLocation", e.target.value)} placeholder="e.g., Mumbai" className="input-elegant" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">No. of Creators Needed</label>
              <input type="number" value={requirement.creatorsNeeded || ""} onChange={(e) => updateReq("creatorsNeeded", parseInt(e.target.value) || 1)} placeholder="e.g., 5" className="input-elegant" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">Preferred Platforms</label>
            <div className="flex flex-wrap gap-2">
              {["instagram", "youtube", "tiktok", "facebook", "twitter", "linkedin"].map((p) => (
                <button key={p} onClick={() => togglePlatform(p)} className={`pill capitalize ${requirement.preferredPlatforms.includes(p) ? "pill-selected" : ""}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Budget & Expectations",
      description: "Set your budget and performance expectations.",
      canProceed: true,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Budget per Creator (Rs.)</label>
              <input type="number" value={requirement.budgetPerCreator || ""} onChange={(e) => updateReq("budgetPerCreator", parseInt(e.target.value) || 0)} placeholder="e.g., 25000" className="input-elegant" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Total Budget (Rs.)</label>
              <input type="number" value={requirement.totalBudget || ""} onChange={(e) => updateReq("totalBudget", parseInt(e.target.value) || 0)} placeholder="e.g., 100000" className="input-elegant" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Min Followers</label>
              <input type="number" value={requirement.minFollowers || ""} onChange={(e) => updateReq("minFollowers", parseInt(e.target.value) || 0)} placeholder="e.g., 10000" className="input-elegant" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Max Followers</label>
              <input type="number" value={requirement.maxFollowers || ""} onChange={(e) => updateReq("maxFollowers", parseInt(e.target.value) || 0)} placeholder="e.g., 500000" className="input-elegant" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Min Engagement %</label>
              <input type="number" step="0.1" value={requirement.minEngagementRate || ""} onChange={(e) => updateReq("minEngagementRate", parseFloat(e.target.value) || 0)} placeholder="e.g., 3.0" className="input-elegant" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Min Likes</label>
              <input type="number" value={requirement.minLikesExpected || ""} onChange={(e) => updateReq("minLikesExpected", parseInt(e.target.value) || 0)} placeholder="e.g., 1000" className="input-elegant" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Min Reach</label>
              <input type="number" value={requirement.minReachExpected || ""} onChange={(e) => updateReq("minReachExpected", parseInt(e.target.value) || 0)} placeholder="e.g., 50000" className="input-elegant" />
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-6 py-12">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-blue flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-['Space_Grotesk'] font-bold text-2xl text-[#1E293B]">Brand Signup</h1>
          <p className="text-sm text-[#64748B] mt-1">Step {step + 1} of {steps.length}</p>
        </div>

        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#2563EB]" : "bg-[#E2E8F0]"}`} />
          ))}
        </div>

        <div className="card-surface p-8">
          <h2 className="font-['Space_Grotesk'] font-semibold text-lg text-[#1E293B] mb-1">{currentStep.title}</h2>
          <p className="text-sm text-[#94A3B8] mb-6">{currentStep.description}</p>
          {currentStep.content}
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={() => { if (step === 0) navigate("/onboarding"); else setStep(step - 1); }} className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#2563EB] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => { if (step < steps.length - 1) setStep(step + 1); else handleSubmit(); }}
            disabled={!currentStep.canProceed || updateProfile.isPending || matching}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {matching ? (
              <><Brain className="w-4 h-4 animate-pulse" /> AI Matching...</>
            ) : step === steps.length - 1 ? (
              <><Brain className="w-4 h-4" /> Submit & AI Match <Check className="w-4 h-4" /></>
            ) : (
              <>Next <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
