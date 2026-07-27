import { useViewMode } from "../viewMode";

function MobileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" strokeLinecap="round" />
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 21h8" strokeLinecap="round" />
      <path d="M12 18v3" strokeLinecap="round" />
    </svg>
  );
}

export function ViewModeToggle() {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className="view-mode-toggle" role="group" aria-label="Display mode">
      <button
        type="button"
        className={viewMode === "mobile" ? "active" : undefined}
        aria-pressed={viewMode === "mobile"}
        aria-label="Mobile view"
        title="Mobile view"
        onClick={() => setViewMode("mobile")}
      >
        <MobileIcon />
      </button>
      <button
        type="button"
        className={viewMode === "desktop" ? "active" : undefined}
        aria-pressed={viewMode === "desktop"}
        aria-label="Desktop view"
        title="Desktop view"
        onClick={() => setViewMode("desktop")}
      >
        <DesktopIcon />
      </button>
    </div>
  );
}
