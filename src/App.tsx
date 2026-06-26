import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import BrandOnboarding from "./pages/BrandOnboarding";
import InfluencerOnboarding from "./pages/InfluencerOnboarding";
import BrandDashboard from "./pages/BrandDashboard";
import InfluencerDashboard from "./pages/InfluencerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import BarterPage from "./pages/BarterPage";
import CreatorMediaKit from "./pages/CreatorMediaKit";
import Pricing from "./pages/Pricing";
import MitraaScore from "./pages/MitraaScore";
import AINegotiation from "./pages/AINegotiation";
import RegionalLanguageHub from "./pages/RegionalLanguageHub";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/onboarding/brand" element={<BrandOnboarding />} />
      <Route path="/onboarding/influencer" element={<InfluencerOnboarding />} />
      <Route path="/brand/dashboard" element={<BrandDashboard />} />
      <Route path="/influencer/dashboard" element={<InfluencerDashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/barter" element={<BarterPage />} />
      <Route path="/creator/:username" element={<CreatorMediaKit />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/mitraa-score" element={<MitraaScore />} />
      <Route path="/negotiation" element={<AINegotiation />} />
      <Route path="/regional-hub" element={<RegionalLanguageHub />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
