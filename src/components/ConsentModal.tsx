import { useState, type KeyboardEvent, type ReactNode } from "react";
import { apiClient } from "@/lib/apiClient";
import { useMutation } from "@tanstack/react-query";
import { Shield, FileText, Cookie, Megaphone, CheckCircle2, AlertTriangle } from "lucide-react";

interface ConsentModalProps {
  onAccepted: () => void;
  onClose?: () => void;
}

interface ConsentRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: ReactNode;
  title: string;
  required?: boolean;
  children: ReactNode;
}

function ConsentRow({ checked, onChange, icon, title, required, children }: ConsentRowProps) {
  const toggle = () => onChange(!checked);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
        checked ? "border-blue-400" : "border-gray-100 hover:border-gray-200"
      }`}
      style={checked ? { borderColor: "var(--blue)", background: "var(--blue-light)" } : {}}
    >
      <div className="flex-shrink-0 mt-0.5">
        <div
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
            checked ? "border-blue-500 bg-blue-500" : "border-gray-300"
          }`}
        >
          {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {title}
          </span>
          {required ? (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: "var(--accent)" }}
            >
              REQUIRED
            </span>
          ) : (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}
            >
              OPTIONAL
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {children}
        </p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
    </div>
  );
}

export default function ConsentModal({ onAccepted, onClose }: ConsentModalProps) {
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [cookiesChecked, setCookiesChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);
  const [error, setError] = useState("");

  const acceptMutation = useMutation({
    mutationFn: () => apiClient.post<any>("/consents/accept", {}),
    onSuccess: () => {
      onAccepted();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleAccept = () => {
    if (!termsChecked || !privacyChecked) {
      setError("You must accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setError("");
    acceptMutation.mutate();
  };

  const openInNewTab = (path: string) => {
    window.open(`/#${path}`, "_blank");
  };

  const Link = ({ href, children }: { href: string; children: ReactNode }) => (
    <span
      onClick={(e) => {
        e.stopPropagation();
        openInNewTab(href);
      }}
      className="font-semibold underline cursor-pointer"
      style={{ color: "var(--blue)" }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          openInNewTab(href);
        }
      }}
    >
      {children}
    </span>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b" style={{ borderColor: "var(--border-light)" }}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--blue-light)" }}
          >
            <Shield className="w-7 h-7" style={{ color: "var(--blue)" }} />
          </div>
          <h2 className="font-bold text-xl mb-1" style={{ color: "var(--text-primary)" }}>
            Terms & Conditions
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Please accept the following to continue
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: "#FEF2F2", color: "#DC2626" }}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Required: Terms */}
          <ConsentRow
            checked={termsChecked}
            onChange={setTermsChecked}
            icon={<FileText className="w-4 h-4" style={{ color: "var(--blue)" }} />}
            title="Terms of Service"
            required
          >
            I agree to the <Link href="/terms">Terms of Service</Link> including brand and
            influencer obligations, payment terms, and content ownership policies.
          </ConsentRow>

          {/* Required: Privacy */}
          <ConsentRow
            checked={privacyChecked}
            onChange={setPrivacyChecked}
            icon={<Shield className="w-4 h-4" style={{ color: "var(--blue)" }} />}
            title="Privacy Policy"
            required
          >
            I agree to the <Link href="/privacy">Privacy Policy</Link> and consent to the
            collection and processing of my personal data as described.
          </ConsentRow>

          {/* Optional: Cookies */}
          <ConsentRow
            checked={cookiesChecked}
            onChange={setCookiesChecked}
            icon={<Cookie className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
            title="Cookies"
          >
            I consent to the use of cookies for analytics, personalization, and improving my
            experience.
          </ConsentRow>

          {/* Optional: Marketing */}
          <ConsentRow
            checked={marketingChecked}
            onChange={setMarketingChecked}
            icon={<Megaphone className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
            title="Marketing Communications"
          >
            I agree to receive marketing emails about new campaigns, platform features, and
            exclusive opportunities.
          </ConsentRow>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t" style={{ borderColor: "var(--border-light)" }}>
          <button
            onClick={handleAccept}
            disabled={acceptMutation.isPending}
            className="w-full btn-primary-blue disabled:opacity-50"
          >
            {acceptMutation.isPending ? "Processing..." : "Accept & Continue"}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-full mt-3 py-3 rounded-2xl text-sm font-medium transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Cancel
            </button>
          )}
          <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            You can manage your preferences anytime from your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}
