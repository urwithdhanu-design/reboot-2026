import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerNav, type CustomerNavPlacement } from "../customerNav";
import { useSession } from "../session";
import { useViewMode } from "../viewMode";
import { CustomerSessionInfo } from "./CustomerSessionInfo";

const NAV_ROUTES: Record<string, string> = {
  home: "/",
  policies: "/policies",
  claims: "/claims",
  wallet: "/wallet",
  profile: "/profile",
};

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "policies", label: "Policies" },
  { id: "claims", label: "Claims" },
  { id: "wallet", label: "Wallet" },
  { id: "profile", label: "Profile" },
] as const;

export function CustomerAppShell({
  active,
  children,
  className = "",
}: {
  active: string;
  children: ReactNode;
  className?: string;
}) {
  const { isDesktopView } = useViewMode();
  const { navPlacement } = useCustomerNav();
  const { token } = useSession();
  const isLanding = className.includes("customer-app-shell--landing");
  const sideRail = isDesktopView && navPlacement === "side";
  const bottomTabs = !isDesktopView || navPlacement === "bottom";
  const showMobileSessionStrip = Boolean(token) && !isDesktopView;

  return (
    <div
      className={`customer-app-shell${sideRail ? " customer-app-shell--side" : " customer-app-shell--tabs"}${className ? ` ${className}` : ""}`}
    >
      {sideRail ? <CustomerSideRail active={active} /> : null}
      <div className="customer-app-main">
        {!sideRail ? <CustomerAppTopBar toggleOnly={isLanding} /> : null}
        {showMobileSessionStrip ? <CustomerSessionInfo variant="mobile" /> : null}
        <main className="customer-app-content" id="customer-main-content">
          <div className="customer-app-page">{children}</div>
        </main>
        {bottomTabs ? (
          <CustomerBottomTabs active={active} showLayoutToggle={isDesktopView} />
        ) : null}
      </div>
    </div>
  );
}

function CustomerSideRail({ active }: { active: string }) {
  const navigate = useNavigate();
  const { navPlacement, setNavPlacement } = useCustomerNav();

  return (
    <aside className="customer-app-rail" aria-label="Primary navigation">
      <div className="customer-app-rail-brand">
        <div>
          <strong>Insure360</strong>
          <span>Customer portal</span>
        </div>
        <CustomerSessionInfo variant="rail" />
      </div>
      <div className="customer-app-rail-scroll">
        <nav className="customer-app-rail-nav" aria-label="App sections">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`customer-app-rail-item${active === item.id ? " active" : ""}`}
            aria-current={active === item.id ? "page" : undefined}
            onClick={() => navigate(NAV_ROUTES[item.id])}
          >
            <span className="customer-app-rail-icon" aria-hidden>
              <NavGlyph id={item.id} />
            </span>
            {item.label}
          </button>
        ))}
        </nav>
      </div>
      <NavPlacementToggle
        placement={navPlacement}
        onChange={setNavPlacement}
        className="customer-app-rail-toggle"
      />
    </aside>
  );
}

function CustomerAppTopBar({ toggleOnly = false }: { toggleOnly?: boolean }) {
  const { isDesktopView } = useViewMode();
  const { navPlacement, setNavPlacement } = useCustomerNav();
  const { token } = useSession();

  if (!isDesktopView) return null;

  return (
    <header className={`customer-app-topbar${toggleOnly ? " customer-app-topbar--toggle-only" : ""}`}>
      {!toggleOnly ? (
        <div className="customer-app-topbar-brand">
          <span className="customer-app-topbar-name">Insure360</span>
        </div>
      ) : (
        <div className="customer-app-topbar-spacer" />
      )}
      {!toggleOnly ? <div className="customer-app-topbar-spacer" /> : null}
      {token ? <CustomerSessionInfo variant="topbar" /> : null}
      <NavPlacementToggle placement={navPlacement} onChange={setNavPlacement} />
    </header>
  );
}

function CustomerBottomTabs({
  active,
  showLayoutToggle = false,
}: {
  active: string;
  showLayoutToggle?: boolean;
}) {
  const navigate = useNavigate();
  const { navPlacement, setNavPlacement } = useCustomerNav();

  return (
    <div className="customer-app-tabs-wrap">
      {showLayoutToggle ? (
        <div className="customer-app-tabs-layout">
          <NavPlacementToggle placement={navPlacement} onChange={setNavPlacement} />
        </div>
      ) : null}
      <nav className="customer-app-tabs-bottom customer-bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-item customer-nav-item${active === item.id ? " active" : ""}`}
          aria-current={active === item.id ? "page" : undefined}
          onClick={() => navigate(NAV_ROUTES[item.id])}
        >
          <span className="customer-nav-icon" aria-hidden>
            <NavGlyph id={item.id} />
          </span>
          {item.label}
        </button>
      ))}
      </nav>
    </div>
  );
}

function NavPlacementToggle({
  placement,
  onChange,
  className = "",
}: {
  placement: CustomerNavPlacement;
  onChange: (p: CustomerNavPlacement) => void;
  className?: string;
}) {
  return (
    <div
      className={`customer-nav-placement${className ? ` ${className}` : ""}`}
      role="group"
      aria-label="Navigation layout"
    >
      <button
        type="button"
        className={placement === "side" ? "active" : undefined}
        aria-pressed={placement === "side"}
        aria-label="Side menu"
        onClick={() => onChange("side")}
        title="Side menu"
      >
        <SideMenuIcon />
      </button>
      <button
        type="button"
        className={placement === "bottom" ? "active" : undefined}
        aria-pressed={placement === "bottom"}
        aria-label="Bottom tabs"
        onClick={() => onChange("bottom")}
        title="Bottom tabs"
      >
        <BottomTabsIcon />
      </button>
    </div>
  );
}

/** Legacy — prefer CustomerAppShell */
export function CustomerNavBar({ active = "home" }: { active?: string }) {
  return <CustomerBottomTabs active={active} />;
}

export function CustomerNav({ active = "home" }: { active?: string }) {
  return <CustomerBottomTabs active={active} />;
}

export const BottomNav = CustomerNav;

function SideMenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h10M4 18h16" />
    </svg>
  );
}

function BottomTabsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 17h18" />
    </svg>
  );
}

function NavGlyph({ id }: { id: string }) {
  const map: Record<string, ReactNode> = {
    home: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m4 11 8-7 8 7" />
        <path d="M6.5 10.5V19h11v-8.5" />
      </svg>
    ),
    policies: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      </svg>
    ),
    claims: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="m8.5 12 2.2 2.2L15.5 9.5" />
      </svg>
    ),
    wallet: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="6.5" width="17" height="12" rx="2.5" />
        <path d="M3.5 10h17" />
      </svg>
    ),
    profile: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c1.8-3.2 4-4.8 7-4.8S17.2 15.8 19 19" />
      </svg>
    ),
  };
  return map[id];
}
