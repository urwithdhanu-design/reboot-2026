import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import { useChatbotOptional } from "./chatbot/ChatbotContext";
import { IconChat, IconChevron } from "./icons";

export {
  AuthLayout,
  AuthError,
  AuthSuccess,
  PasswordStrength,
} from "./components/AuthLayout";

export function StepHeader({ title }: { title: string }) {
  return (
    <div className="step-row">
      <div className="step-label">{title}</div>
    </div>
  );
}

export function AssistantBar({ screen }: { screen: string }) {
  const [message, setMessage] = useState("Loading…");
  const chatbot = useChatbotOptional();

  useEffect(() => {
    let alive = true;
    api
      .assistant(screen)
      .then((res) => {
        if (alive) setMessage(res.message);
      })
      .catch(() => {
        if (alive) setMessage("We're here if you need help.");
      });
    return () => {
      alive = false;
    };
  }, [screen]);

  return (
    <aside
      className="assistant"
      role="button"
      tabIndex={0}
      aria-label="Open insurance support assistant"
      onClick={() => chatbot?.openChat()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          chatbot?.openChat();
        }
      }}
    >
      <div className="assistant-icon" aria-hidden>
        <IconChat size={18} />
      </div>
      <div className="assistant-copy">
        <strong>Insurance Support Assistant</strong>
        <span>{message}</span>
      </div>
      <div className="assistant-chevron" aria-hidden>
        <IconChevron />
      </div>
    </aside>
  );
}

const NAV_ROUTES: Record<string, string> = {
  home: "/marketplace",
  policies: "/policies",
  claims: "/claims",
  wallet: "/wallet",
  profile: "/profile",
};

export function BottomNav({ active = "home" }: { active?: string }) {
  const navigate = useNavigate();
  const items = [
    { id: "home", label: "Home" },
    { id: "policies", label: "Policies" },
    { id: "claims", label: "Claims" },
    { id: "wallet", label: "Wallet" },
    { id: "profile", label: "Profile" },
  ];
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-item${active === item.id ? " active" : ""}`}
          aria-current={active === item.id ? "page" : undefined}
          onClick={() => navigate(NAV_ROUTES[item.id])}
        >
          <span aria-hidden>
            <NavGlyph id={item.id} />
          </span>
          {item.label}
        </button>
      ))}
    </nav>
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
