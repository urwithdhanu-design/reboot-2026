import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CustomerNavPlacement = "bottom" | "side";

type CustomerNavContextValue = {
  navPlacement: CustomerNavPlacement;
  setNavPlacement: (placement: CustomerNavPlacement) => void;
};

const PLACEMENT_KEY = "gcul_customer_nav_placement";
const CustomerNavContext = createContext<CustomerNavContextValue | null>(null);

function readStoredPlacement(): CustomerNavPlacement {
  try {
    const raw = localStorage.getItem(PLACEMENT_KEY);
    if (raw === "bottom" || raw === "side") return raw;
  } catch {
    /* ignore */
  }
  return "side";
}

export function CustomerNavProvider({ children }: { children: ReactNode }) {
  const [navPlacement, setNavPlacementState] = useState<CustomerNavPlacement>(readStoredPlacement);

  const setNavPlacement = useCallback((placement: CustomerNavPlacement) => {
    setNavPlacementState(placement);
    try {
      localStorage.setItem(PLACEMENT_KEY, placement);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ navPlacement, setNavPlacement }),
    [navPlacement, setNavPlacement],
  );

  return (
    <CustomerNavContext.Provider value={value}>{children}</CustomerNavContext.Provider>
  );
}

export function useCustomerNav() {
  const ctx = useContext(CustomerNavContext);
  if (!ctx) throw new Error("useCustomerNav must be used within CustomerNavProvider");
  return ctx;
}

export function useCustomerNavOptional() {
  return useContext(CustomerNavContext);
}
