import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
            Terms of <span className="text-blue-gradient">Service</span>
          </h1>
          <p className="text-sm text-center mb-12" style={{ color: "var(--text-muted)" }}>Last updated: January 1, 2026</p>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              By accessing or using Social Mitraa, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. Social Mitraa reserves the right to modify these terms at any time, and your continued use constitutes acceptance of the updated terms.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>2. Platform Services</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Social Mitraa provides a technology platform that connects brands with content creators ("Influencers") for marketing collaborations, including paid campaigns and barter (product-for-content) exchanges. We facilitate connections, provide AI-powered matching, and offer payment processing services.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>3. User Accounts</h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              To use Social Mitraa, you must register for an account. You agree to provide accurate information and keep it updated. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              We offer three account types: Brand, Influencer/Creator, and Admin. Each account type has different permissions and capabilities within the platform. You must select the account type that accurately represents your role.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>4. Brand Obligations</h2>
            <div className="space-y-2">
              {[
                "Provide accurate campaign requirements and deliverable expectations",
                "Honor agreed-upon payments and deliver products for barter collaborations",
                "Release payments through our escrow system upon content delivery",
                "Do not circumvent the platform to avoid service fees",
                "Respect influencer creative freedom while providing brand guidelines",
                "Ensure all products provided for barter are authentic and as described",
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "var(--blue-light)" }}>
                    <span className="text-xs font-bold" style={{ color: "var(--blue)" }}>{i + 1}</span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>5. Influencer Obligations</h2>
            <div className="space-y-2">
              {[
                "Maintain accurate profile information including follower counts and engagement rates",
                "Deliver content as agreed within the specified timeline",
                "Maintain the published content for at least 30 days unless otherwise agreed",
                "Disclose the brand partnership as per ASCI and government guidelines",
                "Create original content that complies with brand guidelines",
                "Do not use fake engagement, bots, or fraudulent methods",
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "var(--blue-light)" }}>
                    <span className="text-xs font-bold" style={{ color: "var(--blue)" }}>{i + 1}</span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>6. Barter Collaborations</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              In barter collaborations, brands provide products or services in exchange for content creation. The influencer receives the product, creates the agreed-upon content (reels, posts, stories), and publishes it on their social media. The product is the influencer's compensation. Both parties must fulfill their obligations as specified in the barter deal terms.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>7. Payments & Escrow</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              All payments for paid collaborations are processed through our escrow system. Brands deposit funds before work begins. Funds are released to influencers upon content delivery and approval. Social Mitraa charges a platform fee on each transaction. In case of disputes, our resolution team will mediate based on the agreed deliverables.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>8. Content Ownership</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Influencers retain ownership of their created content. Brands receive a license to use the content for the purposes agreed upon in the campaign. Unless explicitly stated otherwise, brands may not modify influencer-created content without permission. Both parties agree that content created through the platform may be used by Social Mitraa for promotional purposes.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>9. Prohibited Activities</h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              Users may not engage in: fraud, spam, harassment, hate speech, illegal activities, circumvention of platform fees, creation of multiple accounts, or any activity that violates applicable laws. Violation may result in account suspension or termination.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10 mb-6">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>10. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Social Mitraa acts as a facilitator and is not liable for disputes between brands and influencers. We do not guarantee campaign results, follower growth, or sales. Our maximum liability is limited to the platform fees paid for the specific transaction in dispute.
            </p>
          </div>

          <div className="surface-card p-8 lg:p-10">
            <h2 className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>11. Governing Law</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in New Delhi, India. For any questions regarding these terms, contact us at <span style={{ color: "var(--blue)" }}>support@socialmitraa.com</span>.
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
