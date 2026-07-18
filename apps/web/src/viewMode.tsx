import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ViewMode = "mobile" | "desktop";

type ViewModeContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  isMobileView: boolean;
  isDesktopView: boolean;
};

const STORAGE_KEY = "gcul_view_mode";
const ViewModeContext = createContext<ViewModeContextValue | null>(null);

function readStoredMode(): ViewMode | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "mobile" || raw === "desktop") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

/** Mobile-first default; remember explicit user choice. */
function initialMode(): ViewMode {
  return readStoredMode() ?? "mobile";
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(initialMode);

  useEffect(() => {
    document.documentElement.dataset.viewMode = viewMode;
    try {
      localStorage.setItem(STORAGE_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  const setViewMode = (mode: ViewMode) => setViewModeState(mode);
  const toggleViewMode = () =>
    setViewModeState((prev) => (prev === "mobile" ? "desktop" : "mobile"));

  const value = useMemo(
    () => ({
      viewMode,
      setViewMode,
      toggleViewMode,
      isMobileView: viewMode === "mobile",
      isDesktopView: viewMode === "desktop",
    }),
    [viewMode],
  );

  return (
    <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
}
