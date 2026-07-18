import { useViewMode } from "../viewMode";

export function ViewModeToggle() {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className="view-mode-toggle" role="group" aria-label="Display mode">
      <span className="view-mode-toggle-label">View</span>
      <button
        type="button"
        className={viewMode === "mobile" ? "active" : undefined}
        aria-pressed={viewMode === "mobile"}
        onClick={() => setViewMode("mobile")}
      >
        Mobile
      </button>
      <button
        type="button"
        className={viewMode === "desktop" ? "active" : undefined}
        aria-pressed={viewMode === "desktop"}
        onClick={() => setViewMode("desktop")}
      >
        Desktop
      </button>
    </div>
  );
}
