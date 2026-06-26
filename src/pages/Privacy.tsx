import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="bg-white border-b" style={{ borderColor: "var(--border-light)" }}>
        <div className="section-container py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 nav-blue">
              <ArrowLeft className="w-4 h-4" /> Back to home
            </button>
            <img src="/logo.png" alt="Social Mitraa" className="h-8 w-auto" />
          </div>
        </div>
      </div>

      <div className="section-container py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-extrabold text-3xl mb-2 text-center" style={{ color: "var(--text-primary)" }}>
            Privacy <span className="text-blue-gradient">Policy</span>
          </h1>
          <p className="text-sm text-center mb-12" style={{ color: "var(--text-muted)" }}>Last updated: January 1, 2026</p>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>1. Introduction</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Social Mitraa is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. By using Social Mitraa, you consent to the practices described in this policy.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>2. Information We Collect</h2>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Account Information</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Name, email address, phone number, profile picture, and account credentials.</p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Profile Information</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>For creators: social media handles, follower counts, engagement rates, content categories, rate cards, and portfolio links. For brands: company name, industry, website, team size, and budget range.</p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Usage Data</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>IP address, browser type, device information, pages visited, and actions taken on the platform.</p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Transaction Data</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Payment information, campaign details, and communication records between brands and creators.</p>
              </div>
            </div>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>3. How We Use Your Information</h2>
            <div className="space-y-2">
              {[
                "Provide and maintain our platform services",
                "Match brands with suitable creators using our AI algorithm",
                "Process payments and manage escrow transactions",
                "Send notifications about campaigns, applications, and payments",
                "Improve our platform and develop new features",
                "Prevent fraud and ensure platform security",
                "Comply with legal obligations",
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "var(--blue-light)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>4. Information Sharing</h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              We share information only in the following circumstances:
            </p>
            <div className="space-y-2">
              {[
                "Between brands and creators when a collaboration is initiated",
                "With payment processors to handle transactions",
                "With service providers who assist our operations (hosting, analytics, customer support)",
                "When required by law or to protect our rights",
                "In connection with a business transfer (merger, acquisition, or sale)",
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "var(--accent-light)" }}>
                    <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>{i + 1}</span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>5. Data Security</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              We implement appropriate technical and organizational measures to protect your data, including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>6. Cookies</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can control cookie preferences through your browser settings. Essential cookies required for platform functionality cannot be disabled.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>7. Your Rights</h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              You have the right to:
            </p>
            <div className="space-y-2">
              {[
                "Access the personal data we hold about you",
                "Correct inaccurate or incomplete data",
                "Request deletion of your personal data",
                "Object to or restrict certain processing activities",
                "Withdraw consent at any time",
                "Request a copy of your data in portable format",
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "var(--blue-light)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>8. Data Retention</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              We retain your personal data for as long as necessary to provide our services and fulfill the purposes outlined in this policy. When you delete your account, we will delete or anonymize your data within 30 days, except where retention is required by law.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>9. Children's Privacy</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Our platform is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>10. Contact Us</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              If you have any questions or concerns about this Privacy Policy, please contact us at <span style={{ color: "var(--blue)" }}>support@socialmitraa.com</span> or through our Instagram <span style={{ color: "var(--blue)" }}>@socialmitraofficial</span>.
            </p>
          </div>
        </div>
      </div>

      <footer className="py-8 border-t" style={{ background: "white", borderColor: "var(--border-light)" }}>
        <div className="section-container text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>&copy; 2026 Social Mitraa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
