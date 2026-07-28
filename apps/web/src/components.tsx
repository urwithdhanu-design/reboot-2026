import { useEffect, useState } from "react";
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

export {
  CustomerPageHeader,
  CustomerTabs,
  CustomerPanel,
  HeaderIconHome,
  HeaderIconPolicies,
  HeaderIconClaims,
  HeaderIconWallet,
  HeaderIconProfile,
} from "./components/CustomerPageHeader";

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

export {
  CustomerAppShell,
  CustomerNav,
  CustomerNavBar,
  BottomNav,
} from "./components/CustomerAppShell";

export { WalletConsentApprovedNotice } from "./components/WalletConsentApprovedNotice";
