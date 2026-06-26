import { Loader2, AlertCircle, Inbox } from "lucide-react";

export function LoadingState() {
  return (
    <div className="dash-empty-state">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#EBF1FD" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--blue)" }} />
      </div>
      <p className="text-sm font-medium" style={{ color: "#64748B" }}>Loading...</p>
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="dash-empty-state">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#FEF2F2" }}>
        <AlertCircle className="w-6 h-6" style={{ color: "#DC2626" }} />
      </div>
      <p className="text-sm font-medium max-w-md" style={{ color: "#1E293B" }}>{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-4 dash-btn-primary"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="dash-empty-state">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#F1F5F9" }}>
        <Inbox className="w-6 h-6" style={{ color: "#64748B" }} />
      </div>
      <h3 className="font-semibold text-sm" style={{ color: "#1E293B" }}>{title}</h3>
      {description && (
        <p className="text-xs max-w-md mt-1" style={{ color: "#64748B" }}>{description}</p>
      )}
    </div>
  );
}
